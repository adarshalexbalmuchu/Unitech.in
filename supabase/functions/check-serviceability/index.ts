/**
 * check-serviceability — Edge Function
 *
 * Checks ShipRocket courier serviceability for a given pincode + weight.
 * Called from the checkout form on pincode blur.
 *
 * AUTH:   Authenticated user (verify_jwt = true)
 * INPUT:  POST { pincode: string, weight_kg: number, cod: boolean }
 * RETURN: { serviceable: boolean, couriers: [...], cheapest: {...} }
 */

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Default pickup pincode (warehouse/origin)
  const PICKUP_PINCODE = Deno.env.get("SHIPROCKET_WAREHOUSE_PINCODE") || "110001";

  try {
    const body = await req.json();
    const { pincode, weight_kg, cod } = body as {
      pincode?: string;
      weight_kg?: number;
      cod?: boolean;
    };

    if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
      return json({ error: "Invalid pincode" }, 400);
    }

    const weight = typeof weight_kg === "number" && weight_kg > 0 ? weight_kg : 0.5;

    // ShipRocket serviceability API uses query params, not body.
    const SHIPROCKET_API_BASE = Deno.env.get("SHIPROCKET_API_BASE") || "https://apiv2.shiprocket.in/v1/external";

    // Get token from the auth module — we'll make a simple serviceability call
    const params = new URLSearchParams({
      pickup_postcode: PICKUP_PINCODE,
      delivery_postcode: pincode,
      weight: String(weight),
      cod: cod ? "1" : "0",
    });

    // deno-lint-ignore no-explicit-any
    const srResult: any = await shipRocketFetch(
      `/courier/serviceability/?${params.toString()}`,
      {
        method: "GET",
        action: "check_serviceability",
        calledBy: "checkout",
      },
      serviceClient,
    );

    // deno-lint-ignore no-explicit-any
    const couriers: any[] =
      srResult?.data?.available_courier_companies || [];

    if (!couriers.length) {
      return json({ serviceable: false, couriers: [], cheapest: null }, 200);
    }

    // Sort by rate to find cheapest
    // deno-lint-ignore no-explicit-any
    const sorted = [...couriers].sort((a: any, b: any) => (a.rate || 0) - (b.rate || 0));
    const cheapest = sorted[0];

    return json({
      serviceable: true,
      couriers: sorted.slice(0, 5).map((c) => ({
        id: c.courier_company_id,
        name: c.courier_name,
        rate: c.rate,
        etdDays: c.etd ? parseInt(c.etd, 10) : null,
        estimatedDelivery: c.etd_hours
          ? new Date(Date.now() + c.etd_hours * 3600000).toISOString().split("T")[0]
          : null,
      })),
      cheapest: {
        id: cheapest.courier_company_id,
        name: cheapest.courier_name,
        rate: cheapest.rate,
        etdDays: cheapest.etd ? parseInt(cheapest.etd, 10) : null,
      },
    }, 200);
  } catch (err) {
    console.error("[check-serviceability] error:", err);
    return json({ error: "Serviceability check failed" }, 500);
  }
});
