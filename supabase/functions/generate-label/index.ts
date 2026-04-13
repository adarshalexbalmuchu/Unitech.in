/**
 * generate-label — Admin Edge Function
 *
 * Generates a shipping label for a shipment via ShipRocket.
 *
 * INPUT:  POST { shipmentId: string }  (internal UUID)
 * AUTH:   Admin only (verify_jwt = true + assertAdminUser)
 * RETURN: 200 { labelUrl, shipmentId, generatedAt }
 */

// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertAdminUser, AdminAuthError } from "../_shared/admin-auth.ts";
import { shipRocketFetch, ShipRocketAPIError } from "../_shared/shiprocket-auth.ts";
import { buildCorsHeaders, handleCorsPreflightOrReject } from "../_shared/cors.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

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
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ── Admin auth ──────────────────────────────────────────────────────────
    const adminUserId = await assertAdminUser(req, serviceClient);

    // ── Parse input ─────────────────────────────────────────────────────────
    const body = await req.json();
    const shipmentId = String(body.shipmentId || "").trim();
    if (!shipmentId) return json({ error: "Missing shipmentId" }, 400);

    // ── Fetch shipment ──────────────────────────────────────────────────────
    const { data: shipment, error: shipErr } = await serviceClient
      .from("shipments")
      .select("id, order_id, shiprocket_shipment_id, awb_number, courier_name")
      .eq("id", shipmentId)
      .single();

    if (shipErr || !shipment) return json({ error: "Shipment not found" }, 404);

    if (!shipment.awb_number) {
      return json(
        { error: "AWB not yet assigned. Cannot generate label before courier assignment." },
        422,
      );
    }

    // ── Call ShipRocket ─────────────────────────────────────────────────────
    const srResponse = (await shipRocketFetch(
      "/courier/generate/label",
      {
        method: "POST",
        body: { shipment_id: [shipment.shiprocket_shipment_id] },
        action: "generate_label",
        orderId: shipment.order_id,
        shipmentId: shipment.id,
        calledBy: adminUserId,
      },
      serviceClient,
    )) as Record<string, unknown>;

    const labelCreated = srResponse.label_created === 1 || srResponse.label_created === true;
    const labelUrl = String(srResponse.label_url || "");

    if (!labelCreated || !labelUrl) {
      return json(
        { error: "Label generation failed. ShipRocket did not return a valid label." },
        502,
      );
    }

    // ── Update shipment ─────────────────────────────────────────────────────
    const generatedAt = new Date().toISOString();
    await serviceClient
      .from("shipments")
      .update({ label_url: labelUrl, label_generated_at: generatedAt })
      .eq("id", shipment.id);

    return json({ labelUrl, shipmentId: shipment.id, generatedAt }, 200);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return json({ error: err.message }, err.httpStatus);
    }
    if (err instanceof ShipRocketAPIError) {
      return json({ error: "ShipRocket label generation failed" }, 502);
    }
    console.error("[generate-label] error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
