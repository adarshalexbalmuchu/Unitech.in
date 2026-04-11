/**
 * track-shipment — Edge Function
 *
 * Returns tracking details for an order's shipments.
 * Verifies the order belongs to the authenticated user.
 *
 * AUTH:   Authenticated user (verify_jwt = true)
 * INPUT:  GET ?orderId={uuid}
 * RETURN: { order, shipments: [{ ...shipment, timeline: [...] }] }
 */

// @ts-expect-error: Deno runtime URL import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { shipRocketFetch } from "../_shared/shiprocket-auth.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const TERMINAL_STATUSES = ["delivered", "returned", "cancelled"];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

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

    // Parse orderId
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");
    if (!orderId) return json({ error: "orderId is required" }, 400);

    // Verify ownership
    const { data: order, error: orderErr } = await serviceClient
      .from("orders")
      .select("id, user_id, status, fulfillment_status, cart_snapshot, shipping_snapshot, amount_total_paise, payment_method, created_at")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) return json({ error: "Order not found" }, 404);
    if (order.user_id !== user.id) return json({ error: "Forbidden" }, 403);

    // Fetch shipments
    const { data: shipments } = await serviceClient
      .from("shipments")
      .select("id, awb_number, courier_name, courier_id, tracking_url, fulfillment_status, estimated_delivery, shipped_at, delivered_at, shiprocket_shipment_id, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    const enrichedShipments = [];

    for (const shipment of (shipments || [])) {
      // deno-lint-ignore no-explicit-any
      let timeline: any[] = [];

      // Try to fetch tracking from ShipRocket if AWB exists
      if (shipment.awb_number) {
        try {
          // deno-lint-ignore no-explicit-any
          const trackingData: any = await shipRocketFetch(
            `/courier/track/awb/${shipment.awb_number}`,
            {
              method: "GET",
              action: "track_shipment",
              shipmentId: shipment.id,
              calledBy: user.id,
            },
            serviceClient,
          );

          // ShipRocket returns tracking_data.shipment_track_activities
          const activities =
            trackingData?.tracking_data?.shipment_track_activities ||
            trackingData?.tracking_data?.track_activities ||
            [];

          // deno-lint-ignore no-explicit-any
          timeline = activities.map((a: any) => ({
            date: a.date,
            activity: a["sr-status-label"] || a.activity || a.status,
            location: a.location || "",
          }));
        } catch {
          // Tracking fetch failed — return empty timeline
        }
      }

      enrichedShipments.push({
        id: shipment.id,
        awbNumber: shipment.awb_number,
        courierName: shipment.courier_name,
        trackingUrl: shipment.tracking_url,
        fulfillmentStatus: shipment.fulfillment_status,
        estimatedDelivery: shipment.estimated_delivery,
        shippedAt: shipment.shipped_at,
        deliveredAt: shipment.delivered_at,
        timeline,
      });
    }

    // Determine overall status message
    let statusMessage = "Your order is being processed.";
    if (shipments && shipments.length > 0) {
      const latestShipment = shipments[shipments.length - 1];
      if (TERMINAL_STATUSES.includes(latestShipment.fulfillment_status)) {
        statusMessage = latestShipment.fulfillment_status === "delivered"
          ? "Your order has been delivered!"
          : latestShipment.fulfillment_status === "returned"
          ? "Your shipment is being returned."
          : "Your order has been cancelled.";
      } else if (latestShipment.fulfillment_status === "shipped" || latestShipment.fulfillment_status === "out_for_delivery") {
        statusMessage = "Your order is on its way!";
      } else if (latestShipment.fulfillment_status === "ndr_pending") {
        statusMessage = "A delivery attempt was made. The courier will try again.";
      }
    }

    return json({
      order: {
        id: order.id,
        status: order.status,
        fulfillmentStatus: order.fulfillment_status,
        cartSnapshot: order.cart_snapshot,
        shippingSnapshot: order.shipping_snapshot,
        amountTotalPaise: order.amount_total_paise,
        paymentMethod: order.payment_method,
        createdAt: order.created_at,
      },
      shipments: enrichedShipments,
      statusMessage,
      isTerminal: TERMINAL_STATUSES.includes(order.fulfillment_status),
    }, 200);
  } catch (err) {
    console.error("[track-shipment] error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
