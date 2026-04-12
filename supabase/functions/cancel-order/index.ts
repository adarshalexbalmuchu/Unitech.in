/**
 * cancel-order — Edge Function
 *
 * Allows an authenticated user to cancel their own order within
 * the cancellation window.
 *
 * AUTH:   Authenticated user (verify_jwt = true)
 * INPUT:  POST { orderId: string }
 * RETURN: 200 { cancelled: true }
 */

// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { shipRocketFetch } from "../_shared/shiprocket-auth.ts";
import { assertValidTransition } from "../_shared/fulfillment-states.ts";
import type { FulfillmentStatus } from "../_shared/fulfillment-states.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Authenticate user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await serviceClient.auth.getUser(token);
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    // Parse body
    const body = await req.json();
    const { orderId } = body as { orderId?: string };
    if (!orderId) return json({ error: "orderId is required" }, 400);

    // Fetch order — verify ownership
    const { data: order, error: orderErr } = await serviceClient
      .from("orders")
      .select("id, user_id, fulfillment_status, cancellation_deadline")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) return json({ error: "Order not found" }, 404);
    if (order.user_id !== user.id) return json({ error: "Forbidden" }, 403);

    // Check cancellation deadline
    if (order.cancellation_deadline) {
      const deadline = new Date(order.cancellation_deadline);
      if (deadline <= new Date()) {
        return json({ error: "Cancellation window has closed." }, 422);
      }
    }

    // Check fulfillment status allows cancellation
    const currentStatus = order.fulfillment_status as FulfillmentStatus;
    if (!["pending", "processing", "sr_push_failed"].includes(currentStatus)) {
      return json({ error: "Order has already been shipped." }, 422);
    }

    // Validate state transition
    assertValidTransition(currentStatus, "cancelled");

    // If ShipRocket order exists, attempt to cancel there too
    const { data: shipment } = await serviceClient
      .from("shipments")
      .select("id, shiprocket_order_id")
      .eq("order_id", orderId)
      .not("shiprocket_order_id", "is", null)
      .limit(1)
      .single();

    if (shipment?.shiprocket_order_id) {
      try {
        await shipRocketFetch(
          "/orders/cancel",
          {
            method: "POST",
            body: { ids: [shipment.shiprocket_order_id] },
            action: "cancel_order_shiprocket",
            orderId,
            shipmentId: shipment.id,
            calledBy: user.id,
          },
          serviceClient,
        );
      } catch (srErr) {
        // Log failure but proceed with local cancellation
        console.error("[cancel-order] ShipRocket cancel failed:", srErr);
        try {
          await serviceClient.from("shiprocket_audit_log").insert({
            action: "cancel_order_shiprocket_failed",
            order_id: orderId,
            shipment_id: shipment.id,
            called_by: user.id,
            called_at: new Date().toISOString(),
            success: false,
            error_message: srErr instanceof Error ? srErr.message : "Unknown error",
          });
        } catch {
          // best effort
        }
      }
    }

    // Update order
    const { error: updateErr } = await serviceClient
      .from("orders")
      .update({
        fulfillment_status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: "customer_requested",
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("[cancel-order] update failed:", updateErr);
      return json({ error: "Failed to cancel order" }, 500);
    }

    // Also update shipment status if exists
    if (shipment) {
      await serviceClient
        .from("shipments")
        .update({ fulfillment_status: "cancelled" })
        .eq("order_id", orderId);
    }

    // Audit log
    try {
      await serviceClient.from("shiprocket_audit_log").insert({
        action: "cancel_order",
        order_id: orderId,
        called_by: user.id,
        called_at: new Date().toISOString(),
        success: true,
      });
    } catch {
      // best effort
    }

    return json({ cancelled: true }, 200);
  } catch (err) {
    console.error("[cancel-order] error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
