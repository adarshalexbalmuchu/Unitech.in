/**
 * redact-shiprocket-pii — Scheduled / Admin Edge Function
 *
 * Redacts PII from shiprocket_audit_log request/response payloads
 * where the related shipment has reached a terminal status.
 *
 * Dual invocation:
 * - Cron (nightly): no Authorization header; validates X-Cron-Secret.
 * - Admin HTTP: Authorization header present → assertAdminUser.
 *
 * Processes max 200 rows per run. Remaining rows caught next run.
 *
 * RETURN: { redacted, skipped, batchLimited }
 */

// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertAdminUser, AdminAuthError } from "../_shared/admin-auth.ts";
import { buildCorsHeaders, handleCorsPreflightOrReject } from "../_shared/cors.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

const BATCH_LIMIT = 200;
const TERMINAL_STATUSES = ["delivered", "returned", "cancelled"];

// PII keys to redact in JSONB payloads — all replaced with '[REDACTED]'
const PII_KEYS = [
  "billing_customer_name",
  "billing_last_name",
  "billing_address",
  "billing_address_2",
  "billing_email",
  "billing_phone",
  "shipping_address",
  "name",
  "phone",
  "email",
  "address",
];

/**
 * Constant-time string comparison for cron secret validation.
 */
function constantTimeEquals(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.length !== bufB.length) {
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

/**
 * Recursively redacts PII keys in a JSONB-compatible object.
 * Returns a new object with PII fields set to '[REDACTED]'.
 * Preserves key structure — never deletes keys.
 */
function redactPiiFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(redactPiiFields);
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_KEYS.includes(key.toLowerCase())) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      result[key] = redactPiiFields(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

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
  const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── Auth: admin JWT OR cron secret ──────────────────────────────────────
  let calledBy = "cron";
  const authHeader = req.headers.get("Authorization");
  const cronSecret = req.headers.get("X-Cron-Secret") || "";

  if (authHeader) {
    // Manual admin invocation
    try {
      calledBy = await assertAdminUser(req, serviceClient);
    } catch (err) {
      if (err instanceof AdminAuthError) {
        return json({ error: err.message }, err.httpStatus);
      }
      return json({ error: "Unauthorized" }, 401);
    }
  } else {
    // Cron invocation — validate shared secret
    if (!CRON_SECRET || !cronSecret || !constantTimeEquals(CRON_SECRET, cronSecret)) {
      return json({ error: "Unauthorized" }, 401);
    }
  }

  try {
    // ── Find eligible audit log rows ──────────────────────────────────────
    // Rows where:
    //   - redacted_at IS NULL
    //   - The related shipment (via shipment_id or order_id → shipments)
    //     has a terminal fulfillment_status
    //   - action is NOT 'pii_redaction_run' (summary rows are never redacted)
    //
    // Strategy: join audit_log → shipments on shipment_id for rows that have it,
    // or via order_id → shipments for rows that only have order_id.
    // For simplicity and batch safety, we query in two passes:
    //   Pass 1: rows with shipment_id pointing to a terminal shipment
    //   Pass 2: rows with only order_id, where ALL shipments for that order are terminal

    // Pass 1: rows with direct shipment_id
    const { data: directRows, error: directErr } = await serviceClient
      .rpc("get_redaction_candidates_direct", { batch_size: BATCH_LIMIT });

    // If the RPC doesn't exist (first deploy), fall back to a manual query
    let eligibleRows: Array<{
      id: string;
      request_payload: unknown;
      response_payload: unknown;
    }> = [];

    if (directErr) {
      // Fallback: query directly
      // Get terminal shipment IDs
      const { data: terminalShipments } = await serviceClient
        .from("shipments")
        .select("id, order_id")
        .in("fulfillment_status", TERMINAL_STATUSES);

      if (terminalShipments && terminalShipments.length > 0) {
        // deno-lint-ignore no-explicit-any
        const terminalShipmentIds = terminalShipments.map((s: any) => s.id);
        // deno-lint-ignore no-explicit-any
        const terminalOrderIds = [...new Set(terminalShipments.map((s: any) => s.order_id))];

        // Fetch audit rows linked to terminal shipments
        const { data: byShipment } = await serviceClient
          .from("shiprocket_audit_log")
          .select("id, request_payload, response_payload")
          .is("redacted_at", null)
          .neq("action", "pii_redaction_run")
          .in("shipment_id", terminalShipmentIds)
          .limit(BATCH_LIMIT);

        if (byShipment) eligibleRows.push(...byShipment);

        // Fetch audit rows linked by order_id only (no shipment_id),
        // where the order's shipments are all terminal
        if (eligibleRows.length < BATCH_LIMIT) {
          const remaining = BATCH_LIMIT - eligibleRows.length;
          const alreadyIds = new Set(eligibleRows.map((r) => r.id));

          const { data: byOrder } = await serviceClient
            .from("shiprocket_audit_log")
            .select("id, request_payload, response_payload, order_id")
            .is("redacted_at", null)
            .is("shipment_id", null)
            .neq("action", "pii_redaction_run")
            .in("order_id", terminalOrderIds)
            .limit(remaining);

          if (byOrder) {
            // Verify ALL shipments for each order are terminal
            // deno-lint-ignore no-explicit-any
            const orderShipmentStatuses = new Map<string, string[]>();
            // deno-lint-ignore no-explicit-any
            for (const s of terminalShipments as any[]) {
              const list = orderShipmentStatuses.get(s.order_id) || [];
              list.push(s.fulfillment_status || "unknown");
              orderShipmentStatuses.set(s.order_id, list);
            }

            // Also need to check if there are non-terminal shipments for these orders
            const { data: nonTerminal } = await serviceClient
              .from("shipments")
              .select("order_id")
              .in("order_id", terminalOrderIds)
              .not("fulfillment_status", "in", `(${TERMINAL_STATUSES.join(",")})`);

            const ordersWithNonTerminal = new Set(
              // deno-lint-ignore no-explicit-any
              (nonTerminal || []).map((s: any) => s.order_id),
            );

            // deno-lint-ignore no-explicit-any
            for (const row of byOrder as any[]) {
              if (
                !alreadyIds.has(row.id) &&
                row.order_id &&
                !ordersWithNonTerminal.has(row.order_id)
              ) {
                eligibleRows.push(row);
              }
            }
          }
        }
      }
    } else {
      eligibleRows = directRows || [];
    }

    // ── Redact and update ─────────────────────────────────────────────────
    let redacted = 0;
    let skipped = 0;

    for (const row of eligibleRows) {
      const redactedRequest = row.request_payload
        ? redactPiiFields(row.request_payload)
        : row.request_payload;
      const redactedResponse = row.response_payload
        ? redactPiiFields(row.response_payload)
        : row.response_payload;

      // Check if anything actually changed
      const reqChanged =
        JSON.stringify(redactedRequest) !== JSON.stringify(row.request_payload);
      const resChanged =
        JSON.stringify(redactedResponse) !== JSON.stringify(row.response_payload);

      if (!reqChanged && !resChanged) {
        // No PII found in this row — still mark as redacted (processed)
        await serviceClient
          .from("shiprocket_audit_log")
          .update({ redacted_at: new Date().toISOString() })
          .eq("id", row.id);
        skipped++;
        continue;
      }

      const { error: updateErr } = await serviceClient
        .from("shiprocket_audit_log")
        .update({
          request_payload: redactedRequest,
          response_payload: redactedResponse,
          redacted_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (updateErr) {
        console.error("[redact-shiprocket-pii] update failed for row", row.id, updateErr);
        skipped++;
      } else {
        redacted++;
      }
    }

    const batchLimited = eligibleRows.length >= BATCH_LIMIT;

    // ── Summary audit log ─────────────────────────────────────────────────
    try {
      await serviceClient.from("shiprocket_audit_log").insert({
        action: "pii_redaction_run",
        called_by: calledBy,
        called_at: new Date().toISOString(),
        success: true,
        response_payload: {
          redacted_count: redacted,
          skipped_count: skipped,
          batch_limited: batchLimited,
        },
      });
    } catch (logErr) {
      console.error("[redact-shiprocket-pii] summary audit log write failed:", logErr);
    }

    return json({ redacted, skipped, batchLimited }, 200);
  } catch (err) {
    console.error("[redact-shiprocket-pii] error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
