/**
 * schedule-pickup — Admin Edge Function
 *
 * Schedules a courier pickup for a shipment via ShipRocket.
 *
 * INPUT:  POST { shipmentId: string, pickupDate: string }
 * AUTH:   Admin only
 * RETURN: 200 { pickupScheduledDate, pickupToken, manifestSequenceHint, courierName }
 */

// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertAdminUser, AdminAuthError } from "../_shared/admin-auth.ts";
import { shipRocketFetch, ShipRocketAPIError } from "../_shared/shiprocket-auth.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

const TERMINAL_STATUSES = new Set(["delivered", "returned", "cancelled"]);

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ── Admin auth ──────────────────────────────────────────────────────────
    const adminUserId = await assertAdminUser(req, serviceClient);

    // ── Parse input ─────────────────────────────────────────────────────────
    const body = await req.json();
    const shipmentId = String(body.shipmentId || "").trim();
    const pickupDate = String(body.pickupDate || "").trim();

    if (!shipmentId) return json({ error: "Missing shipmentId" }, 400);
    if (!pickupDate || !/^\d{4}-\d{2}-\d{2}/.test(pickupDate)) {
      return json({ error: "Missing or invalid pickupDate (expected ISO date)" }, 400);
    }

    // ── Fetch shipment ──────────────────────────────────────────────────────
    const { data: shipment, error: shipErr } = await serviceClient
      .from("shipments")
      .select(
        "id, order_id, shiprocket_shipment_id, awb_number, " +
          "courier_id, courier_name, fulfillment_status",
      )
      .eq("id", shipmentId)
      .single();

    if (shipErr || !shipment) return json({ error: "Shipment not found" }, 404);

    if (!shipment.awb_number) {
      return json(
        { error: "AWB not yet assigned. Cannot schedule pickup before courier assignment." },
        422,
      );
    }

    if (TERMINAL_STATUSES.has(shipment.fulfillment_status)) {
      return json(
        { error: "Cannot schedule pickup for a completed shipment." },
        422,
      );
    }

    // ── Call ShipRocket ─────────────────────────────────────────────────────
    const srResponse = (await shipRocketFetch(
      "/courier/generate/pickup",
      {
        method: "POST",
        body: {
          shipment_id: [shipment.shiprocket_shipment_id],
          pickup_date: [pickupDate],
        },
        action: "schedule_pickup",
        orderId: shipment.order_id,
        shipmentId: shipment.id,
        calledBy: adminUserId,
      },
      serviceClient,
    )) as Record<string, unknown>;

    const pickupScheduledDate =
      String(srResponse.pickup_scheduled_date || pickupDate);
    const pickupToken =
      String(srResponse.pickup_token_number || "");

    // ── Update shipment ─────────────────────────────────────────────────────
    await serviceClient
      .from("shipments")
      .update({
        pickup_scheduled_date: pickupScheduledDate,
        pickup_token: pickupToken,
      })
      .eq("id", shipment.id);

    // ── Courier config hint ─────────────────────────────────────────────────
    let manifestSequenceHint: string | null = null;

    if (shipment.courier_id) {
      const { data: courierCfg } = await serviceClient
        .from("courier_config")
        .select("manifest_sequence")
        .eq("courier_id", shipment.courier_id)
        .maybeSingle();

      if (courierCfg) {
        manifestSequenceHint = courierCfg.manifest_sequence;
      }
    }

    return json(
      {
        pickupScheduledDate,
        pickupToken,
        manifestSequenceHint,
        courierName: shipment.courier_name || null,
      },
      200,
    );
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return json({ error: err.message }, err.httpStatus);
    }
    if (err instanceof ShipRocketAPIError) {
      return json({ error: "ShipRocket pickup scheduling failed" }, 502);
    }
    console.error("[schedule-pickup] error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
