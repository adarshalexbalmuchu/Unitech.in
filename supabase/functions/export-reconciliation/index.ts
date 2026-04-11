/**
 * export-reconciliation — Admin Edge Function
 *
 * Generates a monthly CSV for invoice reconciliation.
 * Contains shipping/billing data only — NO customer PII.
 *
 * INPUT:  GET ?month=YYYY-MM (defaults to previous calendar month)
 * AUTH:   Admin only
 * RETURN: text/csv with Content-Disposition: attachment
 */

// @ts-expect-error: Deno runtime URL import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertAdminUser, AdminAuthError } from "../_shared/admin-auth.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// ── CSV helpers (RFC 4180) ───────────────────────────────────────────────────

function csvEscape(value: unknown): string {
  const str = value == null ? "" : String(value);
  // Wrap in double quotes, escape internal double quotes as ""
  return `"${str.replace(/"/g, '""')}"`;
}

function csvRow(values: unknown[]): string {
  return values.map(csvEscape).join(",");
}

// ── Column definitions ───────────────────────────────────────────────────────

const HEADERS = [
  "order_id",
  "awb_number",
  "courier_name",
  "shiprocket_order_id",
  "shiprocket_shipment_id",
  "declared_weight_kg",
  "declared_length_cm",
  "declared_width_cm",
  "declared_height_cm",
  "declared_zone",
  "origin_pincode",
  "destination_pincode",
  "fulfillment_status",
  "courier_selection_method",
  "label_generated_at",
  "pickup_scheduled_date",
  "manifested_at",
  "shipped_at",
  "delivered_at",
  "estimated_delivery",
  "created_at",
  // From parent order
  "order_total_inr",
  "payment_method",
  "payment_status",
  "customer_pincode",
  // Blank columns for manual reconciliation
  "actual_billed_weight_kg",
  "actual_billed_zone",
  "base_freight_inr",
  "fuel_surcharge_inr",
  "cod_charge_inr",
  "other_charges_inr",
  "total_billed_inr",
  "dispute_raised",
  "dispute_status",
  "notes",
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ── Admin auth ──────────────────────────────────────────────────────────
    const adminUserId = await assertAdminUser(req, serviceClient);

    // ── Parse and validate month ────────────────────────────────────────────
    const url = new URL(req.url);
    let month = (url.searchParams.get("month") || "").trim();

    if (!month) {
      // Default to previous calendar month
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const y = prevMonth.getFullYear();
      const m = String(prevMonth.getMonth() + 1).padStart(2, "0");
      month = `${y}-${m}`;
    }

    if (!MONTH_RE.test(month)) {
      return json({ error: "Invalid month format. Expected YYYY-MM." }, 400);
    }

    // Reject future months
    const now = new Date();
    const [year, mon] = month.split("-").map(Number);
    if (year > now.getFullYear() || (year === now.getFullYear() && mon > now.getMonth() + 1)) {
      return json({ error: "Cannot export future months." }, 400);
    }

    // ── Date range for the month ────────────────────────────────────────────
    const startDate = `${month}-01T00:00:00.000Z`;
    const endYear = mon === 12 ? year + 1 : year;
    const endMon = mon === 12 ? 1 : mon + 1;
    const endDate = `${endYear}-${String(endMon).padStart(2, "0")}-01T00:00:00.000Z`;

    // ── Fetch shipments for the month ───────────────────────────────────────
    const { data: shipments, error: shipErr } = await serviceClient
      .from("shipments")
      .select(
        "id, order_id, awb_number, courier_name, " +
          "shiprocket_order_id, shiprocket_shipment_id, " +
          "declared_weight_kg, declared_length_cm, declared_width_cm, declared_height_cm, " +
          "declared_zone, origin_pincode, destination_pincode, " +
          "fulfillment_status, courier_selection_method, " +
          "label_generated_at, pickup_scheduled_date, manifested_at, " +
          "shipped_at, delivered_at, estimated_delivery, created_at",
      )
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .order("created_at", { ascending: true });

    if (shipErr) {
      console.error("[export-reconciliation] shipments query failed:", shipErr);
      return json({ error: "Failed to fetch shipments" }, 500);
    }

    // ── Build CSV ───────────────────────────────────────────────────────────
    const lines: string[] = [csvRow(HEADERS)];

    if (shipments && shipments.length > 0) {
      // Fetch parent orders for these shipments
      // deno-lint-ignore no-explicit-any
      const orderIds = [...new Set(shipments.map((s: any) => s.order_id))];
      const { data: orders } = await serviceClient
        .from("orders")
        .select("id, amount_total_paise, payment_method, status")
        .in("id", orderIds);

      // deno-lint-ignore no-explicit-any
      const orderMap = new Map((orders || []).map((o: any) => [o.id, o]));

      // deno-lint-ignore no-explicit-any
      for (const s of shipments as any[]) {
        // deno-lint-ignore no-explicit-any
        const order: any = orderMap.get(s.order_id) || {};

        lines.push(
          csvRow([
            s.order_id,
            s.awb_number,
            s.courier_name,
            s.shiprocket_order_id,
            s.shiprocket_shipment_id,
            s.declared_weight_kg,
            s.declared_length_cm,
            s.declared_width_cm,
            s.declared_height_cm,
            s.declared_zone,
            s.origin_pincode,
            s.destination_pincode,
            s.fulfillment_status,
            s.courier_selection_method,
            s.label_generated_at,
            s.pickup_scheduled_date,
            s.manifested_at,
            s.shipped_at,
            s.delivered_at,
            s.estimated_delivery,
            s.created_at,
            // Order fields
            order.amount_total_paise != null
              ? (order.amount_total_paise / 100).toFixed(2)
              : "",
            order.payment_method || "",
            order.status || "",
            s.destination_pincode, // customer_pincode = destination_pincode
            // Blank columns for manual reconciliation
            "", "", "", "", "", "", "", "", "", "",
          ]),
        );
      }
    }

    const csvBody = lines.join("\r\n") + "\r\n";
    const rowCount = shipments ? shipments.length : 0;

    // ── Audit log ───────────────────────────────────────────────────────────
    try {
      await serviceClient.from("shiprocket_audit_log").insert({
        action: "reconciliation_export",
        called_by: adminUserId,
        called_at: new Date().toISOString(),
        success: true,
        request_payload: { month },
        response_payload: { row_count: rowCount },
      });
    } catch (logErr) {
      console.error("[export-reconciliation] audit log write failed:", logErr);
    }

    return new Response(csvBody, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reconciliation-${month}.csv"`,
      },
    });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return json({ error: err.message }, err.httpStatus);
    }
    console.error("[export-reconciliation] error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
