import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((origin: string) => origin.trim())
  .filter(Boolean);

function buildCorsHeaders(origin: string | null) {
  // If ALLOWED_ORIGINS is configured, enforce it; otherwise reflect the request origin
  const allowedOrigin =
    allowedOrigins.length > 0
      ? (origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0])
      : (origin || "*");
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function hmacSha256Hex(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "OPTIONS" && origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY || !RAZORPAY_KEY_SECRET) {
      throw new Error("Missing required environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401, corsHeaders);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const orderId = String(body.orderId || "");
    const razorpayOrderId = String(body.razorpayOrderId || "");
    const razorpayPaymentId = String(body.razorpayPaymentId || "");
    const razorpaySignature = String(body.razorpaySignature || "");

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return jsonResponse({ error: "Missing verification payload" }, 400, corsHeaders);
    }

    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id, user_id, status, razorpay_order_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return jsonResponse({ error: "Order not found" }, 404, corsHeaders);
    }

    if (order.user_id !== user.id) {
      return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
    }

    if (order.status === "paid") {
      return jsonResponse({ status: "paid", orderId: order.id, replayed: true }, 200, corsHeaders);
    }

    if (order.status !== "payment_initiated") {
      return jsonResponse({ error: `Invalid order state: ${order.status}` }, 409, corsHeaders);
    }

    if (order.razorpay_order_id !== razorpayOrderId) {
      return jsonResponse({ error: "Razorpay order mismatch" }, 400, corsHeaders);
    }

    const expectedSignature = await hmacSha256Hex(
      RAZORPAY_KEY_SECRET,
      `${razorpayOrderId}|${razorpayPaymentId}`,
    );

    if (expectedSignature !== razorpaySignature) {
      await serviceClient
        .from("orders")
        .update({
          status: "failed",
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
        })
        .eq("id", order.id);

      return jsonResponse({ status: "failed", reasonCode: "signature_mismatch" }, 400, corsHeaders);
    }

    const cancellationDeadline = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { error: updateError } = await serviceClient
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        fulfillment_status: "pending",
        cancellation_deadline: cancellationDeadline,
      })
      .eq("id", order.id)
      .eq("status", "payment_initiated");

    if (updateError) {
      throw updateError;
    }

    // ── ShipRocket async trigger ────────────────────────────────────────────
    // Fire create-shiprocket-order asynchronously using EdgeRuntime.waitUntil.
    // This keeps the ShipRocket push completely off the payment response path.
    // The create-shiprocket-order function is idempotent — duplicate fires
    // are harmless. The retry-shiprocket-orders cron provides a safety net
    // if this fire-and-forget call fails silently.
    //
    // Approach: EdgeRuntime.waitUntil() — chosen over pg_net because the
    // project config shows no pg_net extension, and waitUntil keeps the
    // trigger logic co-located with the payment verification code.
    // ──────────────────────────────────────────────────────────────────────
    try {
      // @ts-expect-error: EdgeRuntime is a Supabase Deno runtime global
      EdgeRuntime.waitUntil(
        fetch(`${SUPABASE_URL}/functions/v1/create-shiprocket-order`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: order.id }),
        }).catch((triggerErr: unknown) => {
          console.error(
            "[verify-razorpay-payment] ShipRocket async trigger failed (will be retried by cron):",
            triggerErr,
          );
        }),
      );
    } catch (waitUntilErr) {
      // EdgeRuntime.waitUntil may not exist in local dev — log and continue.
      // The retry-shiprocket-orders cron will pick up the order.
      console.error(
        "[verify-razorpay-payment] EdgeRuntime.waitUntil unavailable:",
        waitUntilErr,
      );
    }

    return jsonResponse(
      {
        status: "paid",
        orderId: order.id,
        razorpayPaymentId,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("verify-razorpay-payment error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
      corsHeaders,
    );
  }
});
