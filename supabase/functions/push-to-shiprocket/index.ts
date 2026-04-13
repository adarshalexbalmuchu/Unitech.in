/**
 * push-to-shiprocket — Admin Edge Function
 *
 * Manual "push to ShipRocket" for stuck orders. Resets retry_count,
 * transitions to pending, and invokes the core ShipRocket order
 * creation logic directly.
 *
 * INPUT:  POST { orderId: string }
 * AUTH:   Admin only
 * RETURN: 200 { status: 'pushed', shipmentId } or 500 on failure
 */

// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertAdminUser, AdminAuthError } from "../_shared/admin-auth.ts";
import { assertValidTransition, type FulfillmentStatus } from "../_shared/fulfillment-states.ts";
import { processShipRocketOrder } from "../_shared/create-shiprocket-order-core.ts";
import { buildCorsHeaders, handleCorsPreflightOrReject } from "../_shared/cors.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

const ELIGIBLE_STATUSES = new Set<FulfillmentStatus>([
  "sr_push_failed",
  "manual_review",
]);

Deno.serve(async (req: Request) => {
  const corsResp = handleCorsPreflightOrReject(req);
  if (corsResp) return corsResp;
  const corsHeaders = buildCorsHeaders(req, "POST, OPTIONS");

  function json(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ── Admin auth ──────────────────────────────────────────────────────────
    const adminUserId = await assertAdminUser(req, serviceClient);

    // ── Parse input ─────────────────────────────────────────────────────────
    const body = await req.json();
    const orderId = String(body.orderId || "").trim();
    if (!orderId) return json({ error: "Missing orderId" }, 400);

    // ── Fetch order ─────────────────────────────────────────────────────────
    const { data: order, error: orderErr } = await serviceClient
      .from("orders")
      .select("id, fulfillment_status, retry_count")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) return json({ error: "Order not found" }, 404);

    const currentStatus = order.fulfillment_status as FulfillmentStatus;
    if (!ELIGIBLE_STATUSES.has(currentStatus)) {
      return json(
        {
          error: `Order fulfillment status is '${currentStatus}'. ` +
            `Manual push is only available for 'sr_push_failed' or 'manual_review' orders.`,
        },
        422,
      );
    }

    // ── Reset retry_count and transition to pending ─────────────────────────
    assertValidTransition(currentStatus, "pending");

    const { error: resetErr } = await serviceClient
      .from("orders")
      .update({
        fulfillment_status: "pending",
        retry_count: 0,
      })
      .eq("id", orderId);

    if (resetErr) {
      console.error("[push-to-shiprocket] reset failed:", resetErr);
      return json({ error: "Failed to reset order for retry" }, 500);
    }

    // ── Audit log ───────────────────────────────────────────────────────────
    try {
      await serviceClient.from("shiprocket_audit_log").insert({
        order_id: orderId,
        action: "manual_sr_push",
        called_by: adminUserId,
        called_at: new Date().toISOString(),
        success: true,
        request_payload: {
          previous_status: currentStatus,
          previous_retry_count: order.retry_count ?? 0,
        },
      });
    } catch (logErr) {
      console.error("[push-to-shiprocket] audit log write failed:", logErr);
    }

    // ── Call core logic directly ────────────────────────────────────────────
    const result = await processShipRocketOrder(orderId, serviceClient);

    if (
      result.body.status === "created" ||
      result.body.status === "already_processed"
    ) {
      return json(
        {
          status: "pushed",
          shipmentId: result.body.shipmentId || null,
        },
        200,
      );
    }

    // Push failed again — processShipRocketOrder already set sr_push_failed
    return json(
      {
        status: "failed",
        error: String(result.body.error || "ShipRocket push failed"),
      },
      500,
    );
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return json({ error: err.message }, err.httpStatus);
    }
    console.error("[push-to-shiprocket] error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
