import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CartItemInput = {
  productId: string;
  quantity: number;
};

type ShippingInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((origin) => origin.trim())
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

function validateShipping(shipping: ShippingInput) {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email);
  const phoneOk = /^[0-9+\-\s()]{8,20}$/.test(shipping.phone);
  const pincodeOk = /^[0-9A-Za-z -]{4,10}$/.test(shipping.pincode);

  return (
    shipping.name.trim().length >= 2 &&
    emailOk &&
    phoneOk &&
    shipping.address.trim().length >= 5 &&
    shipping.city.trim().length >= 2 &&
    shipping.state.trim().length >= 2 &&
    pincodeOk
  );
}

Deno.serve(async (req) => {
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

  let step = "init";
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    const missingVars = [
      !SUPABASE_URL && "SUPABASE_URL",
      !SUPABASE_ANON_KEY && "SUPABASE_ANON_KEY",
      !SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
      !RAZORPAY_KEY_ID && "RAZORPAY_KEY_ID",
      !RAZORPAY_KEY_SECRET && "RAZORPAY_KEY_SECRET",
    ].filter(Boolean);

    if (missingVars.length > 0) {
      return jsonResponse(
        { error: `Missing env vars: ${missingVars.join(", ")}` },
        500,
        corsHeaders,
      );
    }

    step = "auth";
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

    step = "parse-body";
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const items = Array.isArray(body.items) ? (body.items as CartItemInput[]) : [];
    const shipping = body.shipping as ShippingInput;
    const idempotencyKey = String(body.idempotencyKey || "").trim();

    if (!idempotencyKey) {
      return jsonResponse({ error: "Missing idempotencyKey" }, 400, corsHeaders);
    }

    if (!items.length) {
      return jsonResponse({ error: "Cart is empty" }, 400, corsHeaders);
    }

    if (!shipping || !validateShipping(shipping)) {
      return jsonResponse({ error: "Invalid shipping details" }, 400, corsHeaders);
    }

    const normalizedItems = items.map((item) => ({
      productId: String(item.productId),
      quantity: Number(item.quantity),
    }));

    if (
      normalizedItems.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0 ||
          item.quantity > 20,
      )
    ) {
      return jsonResponse({ error: "Invalid cart items" }, 400, corsHeaders);
    }

    step = "check-existing-order";
    const { data: existingOrder, error: existingOrderError } = await serviceClient
      .from("orders")
      .select("id, status, razorpay_order_id, amount_total_paise, currency")
      .eq("user_id", user.id)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingOrderError) {
      throw existingOrderError;
    }

    if (existingOrder) {
      return jsonResponse(
        {
          orderId: existingOrder.id,
          razorpayOrderId: existingOrder.razorpay_order_id,
          amountPaise: existingOrder.amount_total_paise,
          currency: existingOrder.currency,
          status: existingOrder.status,
          keyId: RAZORPAY_KEY_ID,
          replayed: true,
        },
        200,
        corsHeaders,
      );
    }

    step = "fetch-products";
    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const { data: products, error: productsError } = await serviceClient
      .from("products")
      .select("id, name, price, is_active")
      .in("id", productIds);

    if (productsError) {
      throw productsError;
    }

    if (!products || products.length !== productIds.length) {
      return jsonResponse({ error: "Some products are invalid or unavailable" }, 400, corsHeaders);
    }

    if (products.some((product) => !product.is_active)) {
      return jsonResponse({ error: "Some products are inactive" }, 400, corsHeaders);
    }

    const productMap = new Map(products.map((product) => [String(product.id), product]));
    const cartSnapshot = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Missing product for ${item.productId}`);
      }

      const unitPriceRupees = Number(product.price);
      if (!Number.isFinite(unitPriceRupees) || unitPriceRupees < 0) {
        throw new Error(`Invalid price for product ${item.productId}`);
      }

      const unitPricePaise = Math.round(unitPriceRupees * 100);
      const lineTotalPaise = unitPricePaise * item.quantity;

      return {
        product_id: String(product.id),
        product_name: product.name,
        quantity: item.quantity,
        unit_price_paise: unitPricePaise,
        line_total_paise: lineTotalPaise,
      };
    });

    const subtotalPaise = cartSnapshot.reduce((sum, line) => sum + line.line_total_paise, 0);
    const totalPaise = subtotalPaise;
    const receipt = `order_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    step = "insert-order";
    const { data: createdOrder, error: createdOrderError } = await serviceClient
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending",
        currency: "INR",
        amount_subtotal_paise: subtotalPaise,
        amount_total_paise: totalPaise,
        cart_snapshot: cartSnapshot,
        shipping_snapshot: shipping,
        idempotency_key: idempotencyKey,
      })
      .select("id")
      .single();

    if (createdOrderError || !createdOrder) {
      throw createdOrderError || new Error("Failed to create pending order");
    }

    step = "razorpay-create-order";
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount: totalPaise,
        currency: "INR",
        receipt,
        notes: {
          app_order_id: createdOrder.id,
          user_id: user.id,
        },
      }),
    });

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok || !razorpayData?.id) {
      await serviceClient
        .from("orders")
        .update({ status: "failed" })
        .eq("id", createdOrder.id);

      throw new Error(
        `Razorpay API error [${razorpayResponse.status}]: ${JSON.stringify(razorpayData)}`,
      );
    }

    step = "update-order-status";
    const { error: updateOrderError } = await serviceClient
      .from("orders")
      .update({
        status: "payment_initiated",
        razorpay_order_id: razorpayData.id,
      })
      .eq("id", createdOrder.id);

    if (updateOrderError) {
      throw updateOrderError;
    }

    return jsonResponse(
      {
        orderId: createdOrder.id,
        razorpayOrderId: razorpayData.id,
        amountPaise: razorpayData.amount,
        currency: razorpayData.currency,
        keyId: RAZORPAY_KEY_ID,
        status: "payment_initiated",
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`create-razorpay-order error at step [${step}]:`, msg, error);
    return jsonResponse(
      { error: msg, step },
      500,
      corsHeaders,
    );
  }
});
