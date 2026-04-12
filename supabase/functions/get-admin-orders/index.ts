/**
 * get-admin-orders — Admin Edge Function
 *
 * Powers the admin orders dashboard. Returns paginated orders with
 * all ShipRocket fulfilment fields. Reads from DB only — no
 * ShipRocket API calls.
 *
 * INPUT:  GET with query params: page, limit, fulfillmentStatus,
 *         paymentStatus, search, flag
 * AUTH:   Admin only
 * RETURN: 200 { orders, total, page, limit, totalPages }
 */

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ── Admin auth ──────────────────────────────────────────────────────────
    await assertAdminUser(req, serviceClient);

    // ── Parse params (from query string for GET, from body for POST) ───────
    let page: number;
    let limit: number;
    let fulfillmentStatus: string;
    let paymentStatus: string;
    let search: string;
    let flag: string;

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      page = Math.max(1, parseInt(body.page || "1", 10));
      limit = Math.min(100, Math.max(1, parseInt(body.limit || "20", 10)));
      fulfillmentStatus = body.fulfillmentStatus || "";
      paymentStatus = body.paymentStatus || "";
      search = (body.search || "").trim();
      flag = body.flag || "";
    } else {
      const url = new URL(req.url);
      page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
      limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
      fulfillmentStatus = url.searchParams.get("fulfillmentStatus") || "";
      paymentStatus = url.searchParams.get("paymentStatus") || "";
      search = (url.searchParams.get("search") || "").trim();
      flag = url.searchParams.get("flag") || "";
    }

    // ── Build order query ───────────────────────────────────────────────────
    let countQuery = serviceClient
      .from("orders")
      .select("id", { count: "exact", head: true });

    let dataQuery = serviceClient
      .from("orders")
      .select(
        "id, created_at, status, fulfillment_status, retry_count, " +
          "amount_total_paise, shipping_snapshot, cancellation_deadline",
      );

    // Filters
    if (fulfillmentStatus) {
      countQuery = countQuery.eq("fulfillment_status", fulfillmentStatus);
      dataQuery = dataQuery.eq("fulfillment_status", fulfillmentStatus);
    }
    if (paymentStatus) {
      countQuery = countQuery.eq("status", paymentStatus);
      dataQuery = dataQuery.eq("status", paymentStatus);
    }
    if (flag === "manual_review") {
      countQuery = countQuery.eq("fulfillment_status", "manual_review");
      dataQuery = dataQuery.eq("fulfillment_status", "manual_review");
    } else if (flag === "ndr_pending") {
      countQuery = countQuery.eq("fulfillment_status", "ndr_pending");
      dataQuery = dataQuery.eq("fulfillment_status", "ndr_pending");
    } else if (flag === "stuck") {
      countQuery = countQuery
        .eq("fulfillment_status", "sr_push_failed")
        .gte("retry_count", 3);
      dataQuery = dataQuery
        .eq("fulfillment_status", "sr_push_failed")
        .gte("retry_count", 3);
    }
    if (search) {
      // Search by order ID (partial UUID match) or customer name in shipping_snapshot
      // Supabase text search on JSONB uses ->> operator via textSearch
      // We use `or` with `ilike` on id and on shipping_snapshot->>'name'
      const searchFilter = `id.ilike.%${search}%,shipping_snapshot->>name.ilike.%${search}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    // ── Get total count ─────────────────────────────────────────────────────
    const { count: total, error: countErr } = await countQuery;
    if (countErr) {
      console.error("[get-admin-orders] count query failed:", countErr);
      return json({ error: "Failed to count orders" }, 500);
    }

    const totalCount = total ?? 0;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

    // ── Fetch orders page ───────────────────────────────────────────────────
    const { data: orders, error: ordersErr } = await dataQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (ordersErr) {
      console.error("[get-admin-orders] orders query failed:", ordersErr);
      return json({ error: "Failed to fetch orders" }, 500);
    }

    if (!orders || orders.length === 0) {
      return json({ orders: [], total: totalCount, page, limit, totalPages }, 200);
    }

    // ── Fetch shipments for these orders ────────────────────────────────────
    // deno-lint-ignore no-explicit-any
    const orderIds = orders.map((o: any) => o.id);

    const { data: shipments } = await serviceClient
      .from("shipments")
      .select(
        "id, order_id, awb_number, courier_name, fulfillment_status, " +
          "label_url, label_generated_at, pickup_scheduled_date, " +
          "manifested_at, estimated_delivery, shipped_at, delivered_at",
      )
      .in("order_id", orderIds);

    // Group shipments by order_id
    // deno-lint-ignore no-explicit-any
    const shipmentsByOrder = new Map<string, any[]>();
    if (shipments) {
      // deno-lint-ignore no-explicit-any
      for (const s of shipments as any[]) {
        const list = shipmentsByOrder.get(s.order_id) || [];
        list.push(s);
        shipmentsByOrder.set(s.order_id, list);
      }
    }

    // ── Fetch open NDR counts per order ─────────────────────────────────────
    // Get all shipment IDs for these orders, then count open NDRs
    const allShipmentIds = shipments
      // deno-lint-ignore no-explicit-any
      ? (shipments as any[]).map((s: any) => s.id)
      : [];

    const ndrCountByOrder = new Map<string, number>();

    if (allShipmentIds.length > 0) {
      const { data: openNdrs } = await serviceClient
        .from("ndr_actions")
        .select("shipment_id")
        .in("shipment_id", allShipmentIds)
        .is("action_taken", null);

      if (openNdrs) {
        // Map shipment_id → order_id for counting
        const shipIdToOrderId = new Map<string, string>();
        if (shipments) {
          // deno-lint-ignore no-explicit-any
          for (const s of shipments as any[]) {
            shipIdToOrderId.set(s.id, s.order_id);
          }
        }
        // deno-lint-ignore no-explicit-any
        for (const ndr of openNdrs as any[]) {
          const oid = shipIdToOrderId.get(ndr.shipment_id);
          if (oid) {
            ndrCountByOrder.set(oid, (ndrCountByOrder.get(oid) || 0) + 1);
          }
        }
      }
    }

    // ── Build response ──────────────────────────────────────────────────────
    // deno-lint-ignore no-explicit-any
    const responseOrders = orders.map((o: any) => {
      const shipping = o.shipping_snapshot || {};
      const orderShipments = shipmentsByOrder.get(o.id) || [];

      return {
        orderId: o.id,
        createdAt: o.created_at,
        customerName: shipping.name || "",
        customerPhone: shipping.phone || "",
        totalAmount: (o.amount_total_paise || 0) / 100,
        paymentStatus: o.status,
        fulfillmentStatus: o.fulfillment_status,
        retryCount: o.retry_count ?? 0,
        cancellationDeadline: o.cancellation_deadline || null,
        // deno-lint-ignore no-explicit-any
        shipments: orderShipments.map((s: any) => ({
          shipmentId: s.id,
          awbNumber: s.awb_number || null,
          courierName: s.courier_name || null,
          fulfillmentStatus: s.fulfillment_status,
          labelUrl: s.label_url || null,
          labelGeneratedAt: s.label_generated_at || null,
          pickupScheduledDate: s.pickup_scheduled_date || null,
          manifestedAt: s.manifested_at || null,
          estimatedDelivery: s.estimated_delivery || null,
          shippedAt: s.shipped_at || null,
          deliveredAt: s.delivered_at || null,
        })),
        openNdrCount: ndrCountByOrder.get(o.id) || 0,
      };
    });

    return json(
      {
        orders: responseOrders,
        total: totalCount,
        page,
        limit,
        totalPages,
      },
      200,
    );
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return json({ error: err.message }, err.httpStatus);
    }
    console.error("[get-admin-orders] error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
