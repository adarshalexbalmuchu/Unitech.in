/**
 * shiprocket-webhook — Public Edge Function
 *
 * Receives push notifications from ShipRocket for shipment status changes,
 * NDR events, and RTO events. This is a public endpoint — ShipRocket posts
 * to it with no user JWT (verify_jwt = false in config.toml).
 *
 * CONTRACT:
 *   - Always return 200 unless signature verification fails (401).
 *   - ShipRocket retries anything other than 200.
 *   - Idempotent via shiprocket_event_log UNIQUE constraint.
 *   - Every status update goes through the fulfillment state machine.
 */

// @ts-expect-error: Deno runtime URL import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  isValidTransition,
  assertValidTransition,
  type FulfillmentStatus,
} from "../_shared/fulfillment-states.ts";
import { mapShipRocketStatus } from "../_shared/shiprocket-status-map.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonOk(body: unknown = { received: true }): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Constant-time string comparison to prevent timing attacks on
 * signature verification. Operates on UTF-8 encoded byte arrays.
 */
function constantTimeEquals(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.length !== bufB.length) {
    // Length mismatch leaks length info but not content.
    // ShipRocket channel secrets are fixed-length so this is acceptable.
    // Still do a dummy comparison to keep timing more uniform.
    let _dummy = 0;
    for (let i = 0; i < bufA.length; i++) {
      _dummy |= bufA[i] ^ (bufB[i % bufB.length] || 0);
    }
    return false;
  }
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

// ─── Webhook payload type ────────────────────────────────────────────────────

interface WebhookPayload {
  awb?: string;
  order_id?: string;
  shipment_id?: string;
  current_status?: string;
  current_status_id?: number;
  event?: string;
  courier_name?: string;
  etd?: string;
  ndr_reason?: string;
  ndr_status?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// ─── Aggregate order status logic ────────────────────────────────────────────

const TERMINAL_STATUSES: Set<FulfillmentStatus> = new Set([
  "delivered",
  "returned",
  "cancelled",
]);

/**
 * Given all shipment statuses for an order, derive the aggregate
 * order-level fulfillment_status.
 *
 * Returns null if the current order status should be kept as-is.
 */
function deriveAggregateOrderStatus(
  shipmentStatuses: FulfillmentStatus[],
): FulfillmentStatus | null {
  if (!shipmentStatuses.length) return null;

  const statusSet = new Set(shipmentStatuses);

  // 1. ANY ndr_pending → order = ndr_pending
  if (statusSet.has("ndr_pending")) return "ndr_pending";

  // 2. ANY rto → order = rto
  if (statusSet.has("rto")) return "rto";

  // 3. ALL delivered → order = delivered
  if (shipmentStatuses.every((s) => s === "delivered")) return "delivered";

  // 4. ANY returned AND all others terminal → order = returned
  if (
    statusSet.has("returned") &&
    shipmentStatuses.every((s) => TERMINAL_STATUSES.has(s))
  ) {
    return "returned";
  }

  // 5. ANY out_for_delivery AND rest are delivered → order = out_for_delivery
  if (
    statusSet.has("out_for_delivery") &&
    shipmentStatuses.every((s) => s === "out_for_delivery" || s === "delivered")
  ) {
    return "out_for_delivery";
  }

  // 6. ALL shipped/out_for_delivery/delivered → order = shipped
  const inTransitSet: Set<FulfillmentStatus> = new Set([
    "shipped",
    "out_for_delivery",
    "delivered",
  ]);
  if (shipmentStatuses.every((s) => inTransitSet.has(s))) return "shipped";

  // 7. Otherwise → keep current
  return null;
}

// ─── Audit log helper (fire-and-forget) ──────────────────────────────────────

// deno-lint-ignore no-explicit-any
async function auditLog(serviceClient: any, entry: Record<string, unknown>): Promise<void> {
  try {
    await serviceClient.from("shiprocket_audit_log").insert({
      called_by: "webhook",
      called_at: new Date().toISOString(),
      ...entry,
    });
  } catch (err) {
    console.error("[shiprocket-webhook] audit log write failed:", err);
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Allow only POST
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (req.method !== "POST") {
    return jsonError(405, "Method not allowed");
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const CHANNEL_SECRET = Deno.env.get("SHIPROCKET_CHANNEL_SECRET") || "";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[shiprocket-webhook] missing SUPABASE env vars");
    return jsonOk(); // don't expose infra errors to ShipRocket
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── 1. SIGNATURE VERIFICATION ─────────────────────────────────────────────
  // ShipRocket sends the secret as x-shiprocket-signature header OR as
  // a 'secret' query parameter — check both.
  const url = new URL(req.url);
  const headerSig = req.headers.get("x-shiprocket-signature") || "";
  const querySig = url.searchParams.get("secret") || "";
  const receivedSecret = headerSig || querySig;

  if (!CHANNEL_SECRET || !receivedSecret || !constantTimeEquals(CHANNEL_SECRET, receivedSecret)) {
    await auditLog(serviceClient, {
      action: "webhook_rejected",
      success: false,
      error_message: "invalid_signature",
      request_payload: { header_present: !!headerSig, query_present: !!querySig },
    });
    return jsonError(401, "Unauthorized");
  }

  // ── 2. PARSE BODY ────────────────────────────────────────────────────────
  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    await auditLog(serviceClient, {
      action: "webhook_rejected",
      success: false,
      error_message: "invalid_json_body",
    });
    return jsonOk(); // malformed body — don't make ShipRocket retry
  }

  // ── 3. IDEMPOTENCY CHECK ─────────────────────────────────────────────────
  // Construct a stable event key from available payload fields.
  const eventIdentifier = payload.awb || String(payload.order_id || "");
  const eventType = payload.event || payload.current_status || "unknown";
  let timestampEpoch = "0";
  if (payload.updated_at) {
    const parsed = new Date(payload.updated_at).getTime();
    if (!isNaN(parsed)) timestampEpoch = String(parsed);
  }
  const eventKey = `${eventIdentifier}:${eventType}:${timestampEpoch}`;

  const { error: idempotencyErr } = await serviceClient
    .from("shiprocket_event_log")
    .insert({
      shiprocket_event_id: eventKey,
      event_type: eventType,
    });

  if (idempotencyErr) {
    // Unique constraint violation → duplicate event → return 200 silently.
    // Any other insert error is also safe to swallow (return 200).
    if (
      typeof idempotencyErr.message === "string" &&
      idempotencyErr.message.includes("duplicate")
    ) {
      return jsonOk();
    }
    // Non-duplicate DB error — log but still return 200 to avoid retries
    // processing this same event if the event_log table is temporarily down.
    console.error("[shiprocket-webhook] event_log insert error:", idempotencyErr);
    return jsonOk();
  }

  // ── 4. RESOLVE SHIPMENT ──────────────────────────────────────────────────
  // Look up by AWB first (most reliable), then by shiprocket_shipment_id.
  // deno-lint-ignore no-explicit-any
  let shipment: any = null;

  if (payload.awb) {
    const { data } = await serviceClient
      .from("shipments")
      .select("*")
      .eq("awb_number", payload.awb)
      .maybeSingle();
    shipment = data;
  }

  if (!shipment && payload.shipment_id) {
    const { data } = await serviceClient
      .from("shipments")
      .select("*")
      .eq("shiprocket_shipment_id", String(payload.shipment_id))
      .maybeSingle();
    shipment = data;
  }

  if (!shipment) {
    await auditLog(serviceClient, {
      action: "webhook_unmatched_shipment",
      success: false,
      request_payload: payload,
      error_message: `No shipment found for awb=${payload.awb}, shipment_id=${payload.shipment_id}`,
    });
    return jsonOk(); // don't retry — won't resolve
  }

  // ── 5. MAP STATUS ────────────────────────────────────────────────────────
  const mappedStatus = mapShipRocketStatus(payload.current_status);

  if (!mappedStatus) {
    await auditLog(serviceClient, {
      action: "webhook_unmapped_status",
      order_id: shipment.order_id,
      shipment_id: shipment.id,
      success: false,
      request_payload: {
        current_status: payload.current_status,
        current_status_id: payload.current_status_id,
        event: payload.event,
      },
      error_message: `Unmapped ShipRocket status: '${payload.current_status}'`,
    });
    return jsonOk(); // unknown status — don't crash, don't update
  }

  // ── 6. STATE TRANSITION GUARD ────────────────────────────────────────────
  const currentShipmentStatus = shipment.fulfillment_status as FulfillmentStatus;

  // If the mapped status equals the current status, treat as no-op success
  if (mappedStatus === currentShipmentStatus) {
    await auditLog(serviceClient, {
      action: "webhook_processed",
      order_id: shipment.order_id,
      shipment_id: shipment.id,
      request_payload: payload,
      response_payload: { mapped_status: mappedStatus, transitions_applied: [] },
      success: true,
      status_code: 200,
    });
    return jsonOk();
  }

  if (!isValidTransition(currentShipmentStatus, mappedStatus)) {
    await auditLog(serviceClient, {
      action: "webhook_illegal_transition",
      order_id: shipment.order_id,
      shipment_id: shipment.id,
      success: false,
      request_payload: {
        from: currentShipmentStatus,
        to: mappedStatus,
        raw_status: payload.current_status,
      },
      error_message: `Illegal transition: '${currentShipmentStatus}' → '${mappedStatus}'`,
    });
    return jsonOk(); // illegal transition — return 200, don't update
  }

  // ── 7. UPDATE SHIPMENTS TABLE ────────────────────────────────────────────
  const transitionsApplied: string[] = [];

  // deno-lint-ignore no-explicit-any
  const shipmentUpdate: Record<string, any> = {
    fulfillment_status: mappedStatus,
  };

  // Conditionally set fields when present in payload
  if (payload.awb && !shipment.awb_number) {
    shipmentUpdate.awb_number = payload.awb;
  }
  if (payload.courier_name) {
    shipmentUpdate.courier_name = payload.courier_name;
  }
  if (payload.etd) {
    // Parse ETD to DATE — ShipRocket sends various date formats
    const parsedEtd = new Date(payload.etd);
    if (!isNaN(parsedEtd.getTime())) {
      shipmentUpdate.estimated_delivery = parsedEtd.toISOString().split("T")[0];
    }
  }
  if (mappedStatus === "shipped") {
    shipmentUpdate.shipped_at = new Date().toISOString();
  }
  if (mappedStatus === "delivered") {
    shipmentUpdate.delivered_at = new Date().toISOString();
  }

  const { error: shipmentUpdateErr } = await serviceClient
    .from("shipments")
    .update(shipmentUpdate)
    .eq("id", shipment.id);

  if (shipmentUpdateErr) {
    console.error("[shiprocket-webhook] shipment update failed:", shipmentUpdateErr);
    // Return 200 to prevent retries — the event is already logged in event_log
    return jsonOk();
  }

  transitionsApplied.push(`shipment:${currentShipmentStatus}→${mappedStatus}`);

  // ── 8. NDR HANDLING ──────────────────────────────────────────────────────
  if (mappedStatus === "ndr_pending") {
    const { error: ndrErr } = await serviceClient
      .from("ndr_actions")
      .insert({
        shipment_id: shipment.id,
        ndr_reason: payload.ndr_reason || "unspecified",
        raised_at: new Date().toISOString(),
        // action_taken remains NULL — pending admin decision
      });

    if (ndrErr) {
      console.error("[shiprocket-webhook] ndr_actions insert failed:", ndrErr);
    }

    await auditLog(serviceClient, {
      action: "ndr_raised",
      order_id: shipment.order_id,
      shipment_id: shipment.id,
      success: true,
      request_payload: {
        ndr_reason: payload.ndr_reason,
        ndr_status: payload.ndr_status,
      },
    });
  }

  // ── 9. RTO HANDLING ──────────────────────────────────────────────────────
  if (mappedStatus === "rto") {
    // Close any open ndr_actions row for this shipment
    const { data: openNdr } = await serviceClient
      .from("ndr_actions")
      .select("id")
      .eq("shipment_id", shipment.id)
      .is("action_taken", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (openNdr) {
      await serviceClient
        .from("ndr_actions")
        .update({
          action_taken: "auto_rto",
          action_taken_by: "system",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", openNdr.id);
    }

    await auditLog(serviceClient, {
      action: "rto_initiated",
      order_id: shipment.order_id,
      shipment_id: shipment.id,
      success: true,
      request_payload: { awb: payload.awb },
    });
  }

  // ── 10. UPDATE ORDER AGGREGATE STATUS ────────────────────────────────────
  const { data: allShipments } = await serviceClient
    .from("shipments")
    .select("fulfillment_status")
    .eq("order_id", shipment.order_id);

  if (allShipments && allShipments.length > 0) {
    const shipmentStatuses = allShipments.map(
      // deno-lint-ignore no-explicit-any
      (s: any) => s.fulfillment_status as FulfillmentStatus,
    );

    const aggregateStatus = deriveAggregateOrderStatus(shipmentStatuses);

    if (aggregateStatus) {
      // Fetch current order fulfillment_status
      const { data: orderRow } = await serviceClient
        .from("orders")
        .select("fulfillment_status")
        .eq("id", shipment.order_id)
        .single();

      if (orderRow) {
        const currentOrderStatus = orderRow.fulfillment_status as FulfillmentStatus;

        if (
          aggregateStatus !== currentOrderStatus &&
          isValidTransition(currentOrderStatus, aggregateStatus)
        ) {
          try {
            assertValidTransition(currentOrderStatus, aggregateStatus);
            await serviceClient
              .from("orders")
              .update({ fulfillment_status: aggregateStatus })
              .eq("id", shipment.order_id);

            transitionsApplied.push(
              `order:${currentOrderStatus}→${aggregateStatus}`,
            );
          } catch (err) {
            console.error(
              "[shiprocket-webhook] order aggregate transition failed:",
              err,
            );
          }
        }
      }
    }
  }

  // ── 11. FINAL AUDIT LOG ──────────────────────────────────────────────────
  await auditLog(serviceClient, {
    action: "webhook_processed",
    order_id: shipment.order_id,
    shipment_id: shipment.id,
    request_payload: payload,
    response_payload: {
      mapped_status: mappedStatus,
      transitions_applied: transitionsApplied,
    },
    success: true,
    status_code: 200,
  });

  return jsonOk();
});
