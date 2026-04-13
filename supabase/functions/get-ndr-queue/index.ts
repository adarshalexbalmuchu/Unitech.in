/**
 * get-ndr-queue — Admin Edge Function
 *
 * Returns all open (unresolved) NDR actions for the admin NDR queue tab.
 * DB-only — does NOT call ShipRocket.
 *
 * INPUT:  GET (no params)
 * AUTH:   Admin only
 * RETURN: { ndrs: [...], totalOpen: number }
 */

// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertAdminUser, AdminAuthError } from "../_shared/admin-auth.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// ShipRocket auto-RTO typically triggers at ~48h.
// Flag at 36h to give admin a 12-hour buffer.
const AUTO_RTO_RISK_HOURS = 36;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ── Admin auth ──────────────────────────────────────────────────────────
    await assertAdminUser(req, serviceClient);

    // ── Fetch open NDRs ─────────────────────────────────────────────────────
    const { data: openNdrs, error: ndrErr } = await serviceClient
      .from("ndr_actions")
      .select("id, shipment_id, ndr_reason, raised_at")
      .is("action_taken", null)
      .order("raised_at", { ascending: true });

    if (ndrErr) {
      console.error("[get-ndr-queue] ndr query failed:", ndrErr);
      return json({ error: "Failed to fetch NDR queue" }, 500);
    }

    if (!openNdrs || openNdrs.length === 0) {
      return json({ ndrs: [], totalOpen: 0 }, 200);
    }

    // ── Fetch related shipments ─────────────────────────────────────────────
    // deno-lint-ignore no-explicit-any
    const shipmentIds = [...new Set(openNdrs.map((n: any) => n.shipment_id))];

    const { data: shipments } = await serviceClient
      .from("shipments")
      .select("id, order_id, awb_number, courier_name")
      .in("id", shipmentIds);

    // deno-lint-ignore no-explicit-any
    const shipmentMap = new Map((shipments || []).map((s: any) => [s.id, s]));

    // ── Fetch related orders for shipping_snapshot ──────────────────────────
    // deno-lint-ignore no-explicit-any
    const orderIds = [...new Set((shipments || []).map((s: any) => s.order_id))];

    const { data: orders } = await serviceClient
      .from("orders")
      .select("id, shipping_snapshot")
      .in("id", orderIds);

    // deno-lint-ignore no-explicit-any
    const orderMap = new Map((orders || []).map((o: any) => [o.id, o]));

    // ── Build response ──────────────────────────────────────────────────────
    const nowMs = Date.now();

    // deno-lint-ignore no-explicit-any
    const ndrs = openNdrs.map((ndr: any) => {
      // deno-lint-ignore no-explicit-any
      const shipment: any = shipmentMap.get(ndr.shipment_id) || {};
      // deno-lint-ignore no-explicit-any
      const order: any = orderMap.get(shipment.order_id) || {};
      const shipping = order.shipping_snapshot || {};

      const raisedAtMs = ndr.raised_at ? new Date(ndr.raised_at).getTime() : nowMs;
      const hoursOpen = Math.max(0, Math.round((nowMs - raisedAtMs) / (1000 * 60 * 60) * 10) / 10);

      // Build full address string from shipping_snapshot
      const addressParts = [
        shipping.address,
        shipping.city,
        shipping.state,
        shipping.pincode,
      ].filter(Boolean);

      return {
        ndrId: ndr.id,
        shipmentId: ndr.shipment_id,
        orderId: shipment.order_id || null,
        awbNumber: shipment.awb_number || null,
        courierName: shipment.courier_name || null,
        customerName: shipping.name || "",
        customerPhone: shipping.phone || "",
        shippingAddress: addressParts.join(", "),
        ndrReason: ndr.ndr_reason || "unspecified",
        raisedAt: ndr.raised_at,
        hoursOpen,
        autoRtoRisk: hoursOpen > AUTO_RTO_RISK_HOURS,
      };
    });

    return json({ ndrs, totalOpen: ndrs.length }, 200);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return json({ error: err.message }, err.httpStatus);
    }
    console.error("[get-ndr-queue] error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
