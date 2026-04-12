/**
 * create-shiprocket-order — HTTP Edge Function
 *
 * Called asynchronously after payment verification. Never in the payment
 * response path. Triggered by:
 *   - EdgeRuntime.waitUntil() in verify-razorpay-payment (primary)
 *   - retry-shiprocket-orders cron (on failure retry)
 *   - Manual admin HTTP call
 *
 * INPUT:  POST { orderId: string }
 * AUTH:   Service role key as Bearer token (verify_jwt = false)
 *
 * Idempotent — safe to call multiple times on the same orderId.
 * The core logic checks the shipments table first and short-circuits
 * if a shipment already exists.
 */

// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processShipRocketOrder } from "../_shared/create-shiprocket-order-core.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── Auth: only service role callers ────────────────────────────────────────
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const authHeader = req.headers.get("Authorization") || "";

  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await req.json();
    const orderId = String(body.orderId || "").trim();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing orderId" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const serviceClient = createClient(SUPABASE_URL, serviceRoleKey);

    const result = await processShipRocketOrder(orderId, serviceClient);

    return new Response(JSON.stringify(result.body), {
      status: result.httpStatus,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[create-shiprocket-order] unhandled error:", err);
    return new Response(
      JSON.stringify({ status: "failed", error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
