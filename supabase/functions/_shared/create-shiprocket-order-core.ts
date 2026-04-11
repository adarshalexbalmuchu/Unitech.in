/**
 * Core logic for pushing a paid order to ShipRocket.
 *
 * Extracted into _shared so both the HTTP Edge Function
 * (create-shiprocket-order) and the retry cron function
 * (retry-shiprocket-orders) can call it without HTTP overhead.
 *
 * IDEMPOTENT — safe to call multiple times on the same orderId.
 * The first check is always the shipments table look-up.
 */

import {
  shipRocketFetch,
  ShipRocketAPIError,
} from "./shiprocket-auth.ts";
import {
  assertValidTransition,
  type FulfillmentStatus,
  IllegalTransitionError,
} from "./fulfillment-states.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

// ─── Result type ─────────────────────────────────────────────────────────────

export interface ProcessResult {
  httpStatus: number;
  body: Record<string, unknown>;
}

// ─── Address sanitisation helpers ────────────────────────────────────────────

const DANGEROUS_CHARS = /[<>"'&\\/]/g;
const MAX_ADDRESS_LEN = 140;

function sanitizeAddressField(raw: string): {
  value: string;
  truncated: boolean;
  originalLength: number;
} {
  let cleaned = (raw || "").replace(DANGEROUS_CHARS, "");
  const originalLength = cleaned.length;
  const truncated = cleaned.length > MAX_ADDRESS_LEN;
  if (truncated) {
    cleaned = cleaned.substring(0, MAX_ADDRESS_LEN);
  }
  return { value: cleaned, truncated, originalLength };
}

function splitName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const trimmed = (fullName || "").trim();
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) {
    return { firstName: trimmed, lastName: "" };
  }
  return {
    firstName: trimmed.substring(0, spaceIdx),
    lastName: trimmed.substring(spaceIdx + 1).trim(),
  };
}

function digitsOnly(phone: string): string {
  return (phone || "").replace(/[^\d]/g, "");
}

// ─── Core processing function ────────────────────────────────────────────────

/**
 * Processes a single order for ShipRocket fulfilment.
 *
 * @param orderId        UUID of the order in public.orders
 * @param serviceClient  Supabase client created with the SERVICE_ROLE_KEY
 *                       (bypasses RLS on all tables).
 */
// deno-lint-ignore no-explicit-any
export async function processShipRocketOrder(
  orderId: string,
  // deno-lint-ignore no-explicit-any
  serviceClient: any,
): Promise<ProcessResult> {
  // ── 1. IDEMPOTENCY GUARD ──────────────────────────────────────────────────
  const { data: existingShipment, error: shipmentCheckErr } =
    await serviceClient
      .from("shipments")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();

  if (shipmentCheckErr) {
    console.error("[create-shiprocket-order] shipment check failed:", shipmentCheckErr);
    return {
      httpStatus: 500,
      body: { status: "failed", error: "Failed to check existing shipments" },
    };
  }

  if (existingShipment) {
    return {
      httpStatus: 200,
      body: { status: "already_processed", shipmentId: existingShipment.id },
    };
  }

  // ── 2. FETCH ORDER ────────────────────────────────────────────────────────
  const { data: order, error: orderErr } = await serviceClient
    .from("orders")
    .select(
      "id, status, fulfillment_status, payment_method, " +
        "cart_snapshot, shipping_snapshot, " +
        "amount_subtotal_paise, created_at",
    )
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return {
      httpStatus: 404,
      body: { status: "failed", error: "Order not found" },
    };
  }

  if (order.status !== "paid") {
    return {
      httpStatus: 400,
      body: {
        status: "failed",
        error: `Order status is '${order.status}', expected 'paid'`,
      },
    };
  }

  const currentFulfillment = order.fulfillment_status as FulfillmentStatus;
  if (
    currentFulfillment !== "pending" &&
    currentFulfillment !== "sr_push_failed"
  ) {
    return {
      httpStatus: 400,
      body: {
        status: "failed",
        error: `Fulfillment status '${currentFulfillment}' not eligible for ShipRocket push`,
      },
    };
  }

  // ── 3. PARSE ORDER DATA ──────────────────────────────────────────────────
  const cartItems = order.cart_snapshot as Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price_paise: number;
    line_total_paise: number;
  }>;

  const shipping = order.shipping_snapshot as {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };

  if (!cartItems?.length || !shipping) {
    return {
      httpStatus: 400,
      body: { status: "failed", error: "Invalid order data (empty cart or missing shipping)" },
    };
  }

  // ── 4. FETCH PRODUCT DATA (dimensions + HSN) ─────────────────────────────
  const productIds = [...new Set(cartItems.map((i) => i.product_id))];
  const { data: products, error: productsErr } = await serviceClient
    .from("products")
    .select("id, name, sku, weight_kg, length_cm, width_cm, height_cm, hsn_code")
    .in("id", productIds);

  if (productsErr || !products) {
    return {
      httpStatus: 500,
      body: { status: "failed", error: "Failed to fetch product data" },
    };
  }

  // ── 5. VALIDATE DIMENSIONS ───────────────────────────────────────────────
  // deno-lint-ignore no-explicit-any
  const missingDim = products.filter(
    // deno-lint-ignore no-explicit-any
    (p: any) =>
      p.weight_kg == null ||
      p.length_cm == null ||
      p.width_cm == null ||
      p.height_cm == null,
  );

  if (missingDim.length > 0) {
    // deno-lint-ignore no-explicit-any
    const missingIds = missingDim.map((p: any) => String(p.id));

    // Transition to sr_push_failed only if not already there
    if (currentFulfillment !== "sr_push_failed") {
      assertValidTransition(currentFulfillment, "sr_push_failed");
      await serviceClient
        .from("orders")
        .update({ fulfillment_status: "sr_push_failed" })
        .eq("id", orderId);
    }

    await serviceClient.from("shiprocket_audit_log").insert({
      order_id: orderId,
      action: "create_order",
      success: false,
      error_message: `Missing product dimensions: ${missingIds.join(", ")}`,
      called_by: "system",
      called_at: new Date().toISOString(),
    });

    return {
      httpStatus: 422,
      body: {
        status: "missing_dimensions",
        error: `Products missing shipping dimensions: ${missingIds.join(", ")}`,
      },
    };
  }

  // ── 6. CALCULATE PACKAGE TOTALS ──────────────────────────────────────────
  // deno-lint-ignore no-explicit-any
  const productMap = new Map(products.map((p: any) => [String(p.id), p]));

  let totalWeightKg = 0;
  let maxLengthCm = 0;
  let maxWidthCm = 0;
  let maxHeightCm = 0;

  for (const item of cartItems) {
    const p = productMap.get(item.product_id);
    if (!p) continue;
    totalWeightKg += Number(p.weight_kg) * item.quantity;
    maxLengthCm = Math.max(maxLengthCm, Number(p.length_cm));
    maxWidthCm = Math.max(maxWidthCm, Number(p.width_cm));
    maxHeightCm = Math.max(maxHeightCm, Number(p.height_cm));
  }

  const originPincode =
    Deno.env.get("SHIPROCKET_WAREHOUSE_PINCODE") || "";
  const destinationPincode = shipping.pincode;

  // ── 7. ADDRESS SANITISATION ──────────────────────────────────────────────
  const addr1 = sanitizeAddressField(shipping.address);
  // shipping_snapshot has a single `address` field — no line 2 available
  const addr2 = sanitizeAddressField("");

  if (addr1.truncated) {
    try {
      await serviceClient.from("shiprocket_audit_log").insert({
        order_id: orderId,
        action: "address_truncated",
        success: true,
        error_message: `billing_address truncated from ${addr1.originalLength} to ${MAX_ADDRESS_LEN} chars`,
        called_by: "system",
        called_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error("[create-shiprocket-order] truncation audit log failed:", logErr);
    }
  }

  // ── 8. BUILD SHIPROCKET PAYLOAD ──────────────────────────────────────────
  const { firstName, lastName } = splitName(shipping.name);
  const phone = digitsOnly(shipping.phone);

  const orderItems = cartItems.map((item) => {
    const p = productMap.get(item.product_id)!;
    return {
      name: p.name,
      sku: p.sku || "",
      units: item.quantity,
      selling_price: item.unit_price_paise / 100, // paise → rupees
      hsn: p.hsn_code || "",
    };
  });

  const subtotalRupees = order.amount_subtotal_paise / 100;

  const srPayload = {
    order_id: String(order.id),
    order_date: new Date(order.created_at).toISOString(),
    pickup_location:
      Deno.env.get("SHIPROCKET_PICKUP_LOCATION_NAME") || "",
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: addr1.value,
    billing_address_2: addr2.value,
    billing_city: shipping.city,
    billing_pincode: destinationPincode,
    billing_state: shipping.state,
    billing_country: "India",
    billing_email: shipping.email,
    billing_phone: phone,
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: order.payment_method === "cod" ? "COD" : "Prepaid",
    sub_total: subtotalRupees,
    length: maxLengthCm,
    breadth: maxWidthCm,
    height: maxHeightCm,
    weight: totalWeightKg,
  };

  // ── 9. CALL SHIPROCKET ───────────────────────────────────────────────────
  try {
    // shipRocketFetch JSON.stringifies `body` internally — pass raw object
    const responseData = (await shipRocketFetch(
      "/orders/create/adhoc",
      {
        method: "POST",
        body: srPayload,
        action: "create_order",
        orderId,
      },
      serviceClient,
    )) as Record<string, unknown>;

    // ── 10. ON SUCCESS ─────────────────────────────────────────────────────
    const srOrderId = responseData.order_id != null
      ? String(responseData.order_id)
      : null;
    const srShipmentId = responseData.shipment_id != null
      ? String(responseData.shipment_id)
      : null;
    const awbNumber = responseData.awb_code
      ? String(responseData.awb_code)
      : null;
    const courierId = responseData.courier_company_id
      ? String(responseData.courier_company_id)
      : null;
    const courierName = responseData.courier_name
      ? String(responseData.courier_name)
      : null;
    const estimatedDelivery = responseData.estimated_delivery ?? null;

    const { data: shipment, error: shipmentInsertErr } =
      await serviceClient
        .from("shipments")
        .insert({
          order_id: orderId,
          shiprocket_order_id: srOrderId,
          shiprocket_shipment_id: srShipmentId,
          awb_number: awbNumber,
          courier_id: courierId,
          courier_name: courierName,
          fulfillment_status: "processing",
          courier_selection_method: "auto",
          declared_weight_kg: totalWeightKg,
          declared_length_cm: maxLengthCm,
          declared_width_cm: maxWidthCm,
          declared_height_cm: maxHeightCm,
          origin_pincode: originPincode,
          destination_pincode: destinationPincode,
          estimated_delivery: estimatedDelivery,
        })
        .select("id")
        .single();

    if (shipmentInsertErr) {
      throw new Error(
        `Failed to insert shipment row: ${shipmentInsertErr.message}`,
      );
    }

    // Validate transition BEFORE writing
    assertValidTransition(currentFulfillment, "processing");
    await serviceClient
      .from("orders")
      .update({ fulfillment_status: "processing" })
      .eq("id", orderId);

    return {
      httpStatus: 200,
      body: { status: "created", shipmentId: shipment.id },
    };
  } catch (err) {
    // ── 11. ON FAILURE ─────────────────────────────────────────────────────
    // Transition to sr_push_failed only if not already there
    if (currentFulfillment !== "sr_push_failed") {
      try {
        assertValidTransition(currentFulfillment, "sr_push_failed");
        await serviceClient
          .from("orders")
          .update({ fulfillment_status: "sr_push_failed" })
          .eq("id", orderId);
      } catch (transErr) {
        console.error(
          "[create-shiprocket-order] transition error on failure path:",
          transErr,
        );
      }
    }

    // Audit log was already written by shipRocketFetch for API errors.
    // Never expose raw ShipRocket errors to callers.
    const safeMessage =
      err instanceof ShipRocketAPIError
        ? "ShipRocket API call failed"
        : err instanceof IllegalTransitionError
          ? err.message
          : "Internal processing error";

    console.error("[create-shiprocket-order] failed for order", orderId, err);

    return {
      httpStatus: 500,
      body: { status: "failed", error: safeMessage },
    };
  }
}
