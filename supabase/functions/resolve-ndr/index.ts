/**
 * resolve-ndr — Admin Edge Function
 *
 * Resolves an open NDR action by calling the appropriate ShipRocket endpoints.
 *
 * INPUT:  POST { ndrId, action, newAddress? }
 *         action ∈ { "reattempt", "update_address", "cancel_rto" }
 *         newAddress (required for update_address):
 *           { address, city, state, pincode }
 *
 * AUTH:   Admin only
 * RETURN: { success: true, ndrId, action }
 *
 * For update_address: calls BOTH address update AND reattempt ShipRocket endpoints.
 * Returns 422 if the NDR is already resolved.
 */

// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertAdminUser, AdminAuthError } from "../_shared/admin-auth.ts";
import { shipRocketFetch } from "../_shared/shiprocket-auth.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

const VALID_ACTIONS = ["reattempt", "update_address", "cancel_rto"] as const;
type NdrAction = (typeof VALID_ACTIONS)[number];

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

    // ── Parse body ──────────────────────────────────────────────────────────
    const body = await req.json();
    const { ndrId, action, newAddress } = body as {
      ndrId?: string;
      action?: string;
      newAddress?: {
        address?: string;
        city?: string;
        state?: string;
        pincode?: string;
      };
    };

    if (!ndrId || typeof ndrId !== "string") {
      return json({ error: "ndrId is required" }, 400);
    }
    if (!action || !VALID_ACTIONS.includes(action as NdrAction)) {
      return json(
        { error: `action must be one of: ${VALID_ACTIONS.join(", ")}` },
        400,
      );
    }

    if (action === "update_address") {
      if (
        !newAddress ||
        !newAddress.address ||
        !newAddress.city ||
        !newAddress.state ||
        !newAddress.pincode
      ) {
        return json(
          {
            error:
              "newAddress with address, city, state, pincode is required for update_address",
          },
          400,
        );
      }
    }

    // ── Fetch and validate NDR ──────────────────────────────────────────────
    const { data: ndr, error: ndrErr } = await serviceClient
      .from("ndr_actions")
      .select("id, shipment_id, action_taken, ndr_reason")
      .eq("id", ndrId)
      .single();

    if (ndrErr || !ndr) {
      return json({ error: "NDR action not found" }, 404);
    }

    if (ndr.action_taken) {
      return json(
        {
          error: "NDR already resolved",
          existingAction: ndr.action_taken,
        },
        422,
      );
    }

    // ── Fetch shipment for AWB ──────────────────────────────────────────────
    const { data: shipment, error: shipErr } = await serviceClient
      .from("shipments")
      .select("id, order_id, awb_number, shiprocket_shipment_id")
      .eq("id", ndr.shipment_id)
      .single();

    if (shipErr || !shipment) {
      return json({ error: "Related shipment not found" }, 404);
    }

    if (!shipment.awb_number) {
      return json({ error: "Shipment has no AWB number — cannot resolve NDR" }, 400);
    }

    // ── Execute action ──────────────────────────────────────────────────────
    const fetchOpts = {
      orderId: shipment.order_id,
      shipmentId: shipment.id,
      calledBy: adminUserId,
    };

    if (action === "reattempt") {
      // POST /courier/assign/awb — reattempt delivery
      await shipRocketFetch(
        "/shipments/update/pickup",
        {
          method: "POST",
          body: { awb: shipment.awb_number },
          action: "ndr_reattempt",
          ...fetchOpts,
        },
        serviceClient,
      );
    } else if (action === "update_address") {
      // Step 1: Update the shipping address
      await shipRocketFetch(
        `/orders/address/update`,
        {
          method: "POST",
          body: {
            order_id: shipment.shiprocket_shipment_id,
            shipping_address: newAddress!.address,
            shipping_city: newAddress!.city,
            shipping_state: newAddress!.state,
            shipping_pincode: newAddress!.pincode,
          },
          action: "ndr_update_address",
          ...fetchOpts,
        },
        serviceClient,
      );

      // Step 2: Also reattempt after address update
      await shipRocketFetch(
        "/shipments/update/pickup",
        {
          method: "POST",
          body: { awb: shipment.awb_number },
          action: "ndr_reattempt_after_address",
          ...fetchOpts,
        },
        serviceClient,
      );
    } else if (action === "cancel_rto") {
      // Cancel RTO — requests return to origin be cancelled
      await shipRocketFetch(
        "/orders/cancel",
        {
          method: "POST",
          body: { ids: [shipment.shiprocket_shipment_id] },
          action: "ndr_cancel_rto",
          ...fetchOpts,
        },
        serviceClient,
      );
    }

    // ── Update ndr_actions row ──────────────────────────────────────────────
    const { error: updateErr } = await serviceClient
      .from("ndr_actions")
      .update({
        action_taken: action,
        action_taken_by: adminUserId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", ndrId);

    if (updateErr) {
      console.error("[resolve-ndr] failed to update ndr_actions:", updateErr);
      // The ShipRocket action already succeeded — log error but still return success
      // The admin can see the action was partially completed
    }

    return json({
      success: true,
      ndrId,
      action,
      awbNumber: shipment.awb_number,
    }, 200);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return json({ error: err.message }, err.httpStatus);
    }
    console.error("[resolve-ndr] error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
