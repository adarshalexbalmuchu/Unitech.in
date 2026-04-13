/**
 * retry-shiprocket-orders — Scheduled Edge Function
 *
 * Designed to run on a pg_cron schedule (every 15 minutes) or be
 * triggered manually by an admin via HTTP.
 *
 * Picks up orders stuck in `sr_push_failed`, increments retry_count,
 * and re-invokes the core ShipRocket order creation logic directly
 * (no HTTP round-trip).
 *
 * RATE LIMIT: max 10 orders per cron run.
 * ESCALATION: after 5 failed retries → fulfillment_status = 'manual_review'.
 *
 * AUTH: Service role key as Bearer token (verify_jwt = false).
 */

// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processShipRocketOrder } from "../_shared/create-shiprocket-order-core.ts";
import { assertValidTransition } from "../_shared/fulfillment-states.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

const MAX_ORDERS_PER_RUN = 10;
const MAX_RETRIES = 5;
const COOLDOWN_MINUTES = 10;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // ── Auth: only service role callers ────────────────────────────────────────
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const authHeader = req.headers.get("Authorization") || "";

  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const serviceClient = createClient(SUPABASE_URL, serviceRoleKey);

    // ── 1. Query eligible orders ────────────────────────────────────────────
    // Orders that:
    //   - fulfillment_status = 'sr_push_failed'
    //   - retry_count < MAX_RETRIES
    //   - updated_at older than COOLDOWN_MINUTES (no aggressive retries)
    // Ordered by updated_at ASC (oldest first), limited to MAX_ORDERS_PER_RUN.

    const cooldownCutoff = new Date(
      Date.now() - COOLDOWN_MINUTES * 60 * 1000,
    ).toISOString();

    const { data: failedOrders, error: queryErr } = await serviceClient
      .from("orders")
      .select("id, fulfillment_status, retry_count")
      .eq("fulfillment_status", "sr_push_failed")
      .lt("retry_count", MAX_RETRIES)
      .lt("updated_at", cooldownCutoff)
      .order("updated_at", { ascending: true })
      .limit(MAX_ORDERS_PER_RUN);

    if (queryErr) {
      console.error("[retry-shiprocket-orders] query failed:", queryErr);
      return new Response(
        JSON.stringify({ error: "Failed to query eligible orders" }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    if (!failedOrders || failedOrders.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, succeeded: 0, escalated: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    // ── 2. Process each order ───────────────────────────────────────────────
    let succeeded = 0;
    let escalated = 0;

    for (const order of failedOrders) {
      const currentRetry = (order.retry_count ?? 0) + 1;

      // Increment retry_count BEFORE attempting
      await serviceClient
        .from("orders")
        .update({ retry_count: currentRetry })
        .eq("id", order.id);

      const result = await processShipRocketOrder(order.id, serviceClient);

      if (result.body.status === "created" || result.body.status === "already_processed") {
        succeeded++;
        continue;
      }

      // Still failing — check if retries exhausted
      if (currentRetry >= MAX_RETRIES) {
        try {
          assertValidTransition("sr_push_failed", "manual_review");
          await serviceClient
            .from("orders")
            .update({ fulfillment_status: "manual_review" })
            .eq("id", order.id);

          await serviceClient.from("shiprocket_audit_log").insert({
            order_id: order.id,
            action: "escalated_to_manual_review",
            success: false,
            error_message: `Order exhausted ${MAX_RETRIES} retries — escalated to manual review`,
            called_by: "system",
            called_at: new Date().toISOString(),
          });

          escalated++;
        } catch (transErr) {
          console.error(
            `[retry-shiprocket-orders] escalation transition failed for order ${order.id}:`,
            transErr,
          );
        }
      }
    }

    const processed = failedOrders.length;

    return new Response(
      JSON.stringify({ processed, succeeded, escalated }),
      { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  } catch (err) {
    console.error("[retry-shiprocket-orders] unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  }
});
