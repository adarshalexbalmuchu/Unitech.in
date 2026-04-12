/**
 * generate-manifest — Admin Edge Function
 *
 * Generates a shipping manifest for one or more shipments via ShipRocket.
 * Accepts up to 50 shipment IDs per call.
 *
 * INPUT:  POST { shipmentIds: string[] }  (internal UUIDs)
 * AUTH:   Admin only
 * RETURN: 200 { manifestUrl, manifested, skipped, alreadyManifested }
 */

// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertAdminUser, AdminAuthError } from "../_shared/admin-auth.ts";
import { shipRocketFetch, ShipRocketAPIError } from "../_shared/shiprocket-auth.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

const MAX_SHIPMENTS = 50;
const TERMINAL_STATUSES = new Set(["delivered", "returned", "cancelled"]);

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
    // ── Admin auth ──────────────────────────────────────────────────────────
    const adminUserId = await assertAdminUser(req, serviceClient);

    // ── Parse input ─────────────────────────────────────────────────────────
    const body = await req.json();
    const shipmentIds = Array.isArray(body.shipmentIds) ? body.shipmentIds : [];

    if (!shipmentIds.length) {
      return json({ error: "Missing shipmentIds array" }, 400);
    }
    if (shipmentIds.length > MAX_SHIPMENTS) {
      return json(
        { error: `Maximum ${MAX_SHIPMENTS} shipments per manifest request` },
        400,
      );
    }

    const ids = shipmentIds.map((id: unknown) => String(id).trim()).filter(Boolean);
    if (!ids.length) return json({ error: "No valid shipment IDs provided" }, 400);

    // ── Fetch shipments ─────────────────────────────────────────────────────
    const { data: shipments, error: shipErr } = await serviceClient
      .from("shipments")
      .select(
        "id, order_id, shiprocket_shipment_id, awb_number, fulfillment_status",
      )
      .in("id", ids);

    if (shipErr || !shipments) {
      return json({ error: "Failed to fetch shipments" }, 500);
    }

    // Partition into eligible and skipped
    const eligible: typeof shipments = [];
    const skipped: string[] = [];

    // Track which IDs were found
    const foundIds = new Set(shipments.map((s: { id: string }) => s.id));

    // IDs not found in DB are skipped
    for (const id of ids) {
      if (!foundIds.has(id)) skipped.push(id);
    }

    for (const s of shipments) {
      if (!s.awb_number || TERMINAL_STATUSES.has(s.fulfillment_status)) {
        skipped.push(s.id);
      } else {
        eligible.push(s);
      }
    }

    if (!eligible.length) {
      return json(
        {
          error: "No eligible shipments — all missing AWB or in terminal status",
          skipped,
        },
        422,
      );
    }

    // ── Call ShipRocket ─────────────────────────────────────────────────────
    const srShipmentIds = eligible.map(
      (s: { shiprocket_shipment_id: string }) => s.shiprocket_shipment_id,
    );

    const srResponse = (await shipRocketFetch(
      "/manifests/generate",
      {
        method: "POST",
        body: { shipment_id: srShipmentIds },
        action: "generate_manifest",
        calledBy: adminUserId,
      },
      serviceClient,
    )) as Record<string, unknown>;

    const manifestUrl = String(srResponse.manifest_url || "");
    const alreadyManifestedSrIds = Array.isArray(srResponse.already_manifested)
      ? (srResponse.already_manifested as string[]).map(String)
      : [];

    // Map ShipRocket IDs back to internal UUIDs
    const srIdToUuid = new Map(
      eligible.map((s: { id: string; shiprocket_shipment_id: string }) => [
        String(s.shiprocket_shipment_id),
        s.id,
      ]),
    );

    const alreadyManifested: string[] = alreadyManifestedSrIds
      .map((srId) => srIdToUuid.get(srId))
      .filter((uuid): uuid is string => !!uuid);

    const alreadyManifestedSet = new Set(alreadyManifested);
    const manifested = eligible
      .map((s: { id: string }) => s.id)
      .filter((id: string) => !alreadyManifestedSet.has(id));

    // ── Update shipments ────────────────────────────────────────────────────
    if (manifested.length > 0 && manifestUrl) {
      const now = new Date().toISOString();
      await serviceClient
        .from("shipments")
        .update({ manifest_url: manifestUrl, manifested_at: now })
        .in("id", manifested);
    }

    // ── Audit log ───────────────────────────────────────────────────────────
    try {
      await serviceClient.from("shiprocket_audit_log").insert({
        action: "generate_manifest",
        called_by: adminUserId,
        called_at: new Date().toISOString(),
        success: true,
        request_payload: {
          shipment_count: eligible.length,
          shipment_ids: eligible.map((s: { id: string }) => s.id),
        },
        response_payload: {
          manifest_url: manifestUrl,
          already_manifested_count: alreadyManifested.length,
        },
      });
    } catch (logErr) {
      console.error("[generate-manifest] audit log write failed:", logErr);
    }

    return json(
      {
        manifestUrl,
        manifested,
        skipped,
        alreadyManifested,
      },
      200,
    );
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return json({ error: err.message }, err.httpStatus);
    }
    if (err instanceof ShipRocketAPIError) {
      return json({ error: "ShipRocket manifest generation failed" }, 502);
    }
    console.error("[generate-manifest] error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
