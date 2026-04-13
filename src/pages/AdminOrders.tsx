import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Package, Truck, AlertTriangle, ExternalLink, Loader2, RefreshCw,
  Download, CheckSquare, Tag, Calendar, FileText, Search, Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPrice } from "@/lib/constants";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import AdminLayout from "@/components/admin/AdminLayout";
import OrderCardMobile from "@/components/admin/OrderCardMobile";

// ── Fulfillment status display ────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:          { label: "Pending",             color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  sr_push_failed:   { label: "Push Failed",         color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  processing:       { label: "Processing",          color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  shipped:          { label: "Shipped",             color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  out_for_delivery: { label: "Out for Delivery",    color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  delivered:        { label: "Delivered",            color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  ndr_pending:      { label: "NDR Pending",         color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  returned:         { label: "Returned",            color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  rto:              { label: "RTO",                 color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  cancelled:        { label: "Cancelled",           color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  manual_review:    { label: "Manual Review",       color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  courier_pending:  { label: "Courier Pending",     color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "stuck", label: "Stuck" },
  { key: "ndr", label: "NDR" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "returned", label: "Returned" },
];

function matchesFilter(status: string, filter: string): boolean {
  switch (filter) {
    case "all": return true;
    case "pending": return status === "pending" || status === "processing";
    case "stuck": return status === "sr_push_failed" || status === "manual_review";
    case "ndr": return status === "ndr_pending";
    case "shipped": return status === "shipped" || status === "out_for_delivery";
    case "delivered": return status === "delivered";
    case "returned": return status === "returned" || status === "rto" || status === "cancelled";
    default: return true;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminOrder {
  id: string;
  status: string;
  fulfillment_status: string;
  shipping_snapshot: { name?: string; pincode?: string };
  amount_total_paise: number;
  created_at: string;
  // Joined shipment data
  shipment_id?: string;
  awb_number?: string;
  courier_name?: string;
  tracking_url?: string;
  shiprocket_order_id?: string;
  label_url?: string;
  label_generated_at?: string;
  pickup_scheduled_date?: string;
  manifest_url?: string;
  manifested_at?: string;
}

interface NdrItem {
  ndrId: string;
  shipmentId: string;
  orderId: string;
  awbNumber: string;
  courierName: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  ndrReason: string;
  raisedAt: string;
  hoursOpen: number;
  autoRtoRisk: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

const AdminOrders = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();

  // Orders tab state
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // NDR tab state
  const [ndrs, setNdrs] = useState<NdrItem[]>([]);
  const [ndrsLoading, setNdrsLoading] = useState(false);

  // Action loading states
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Modals
  const [pickupModal, setPickupModal] = useState<{ orderId: string; shipmentId: string } | null>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [ndrAddressModal, setNdrAddressModal] = useState<NdrItem | null>(null);
  const [ndrAddress, setNdrAddress] = useState({ address: "", city: "", state: "", pincode: "" });
  const [ndrConfirmRto, setNdrConfirmRto] = useState<NdrItem | null>(null);

  // Reconciliation
  const [reconMonth, setReconMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // ── Fetch orders ────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!supabase) return;
    setOrdersLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("get-admin-orders", {
        body: {},
      });

      if (error) throw error;

      // Map camelCase Edge Function response to flat snake_case AdminOrder
      const rawOrders = data?.orders || data || [];
      const mapped = rawOrders.map((o: Record<string, unknown>) => {
        // If already in snake_case (fallback shape), pass through
        if (o.id && o.fulfillment_status !== undefined) return o;
        // Map camelCase → flat AdminOrder
        const firstShipment = o.shipments?.[0];
        return {
          id: o.orderId || o.id,
          status: o.paymentStatus || o.status || "",
          fulfillment_status: o.fulfillmentStatus || o.fulfillment_status || "pending",
          shipping_snapshot: o.shipping_snapshot || { name: o.customerName, phone: o.customerPhone },
          amount_total_paise: o.amount_total_paise ?? (o.totalAmount != null ? Math.round(Number(o.totalAmount) * 100) : 0),
          created_at: o.createdAt || o.created_at,
          shipment_id: firstShipment?.shipmentId || firstShipment?.id || undefined,
          awb_number: firstShipment?.awbNumber || firstShipment?.awb_number || undefined,
          courier_name: firstShipment?.courierName || firstShipment?.courier_name || undefined,
          tracking_url: firstShipment?.trackingUrl || firstShipment?.tracking_url || undefined,
          shiprocket_order_id: firstShipment?.shiprocketOrderId || firstShipment?.shiprocket_order_id || undefined,
          label_url: firstShipment?.labelUrl || firstShipment?.label_url || undefined,
          label_generated_at: firstShipment?.labelGeneratedAt || firstShipment?.label_generated_at || undefined,
          pickup_scheduled_date: firstShipment?.pickupScheduledDate || firstShipment?.pickup_scheduled_date || undefined,
          manifest_url: firstShipment?.manifestUrl || firstShipment?.manifest_url || undefined,
          manifested_at: firstShipment?.manifestedAt || firstShipment?.manifested_at || undefined,
        } as AdminOrder;
      });
      setOrders(mapped);
    } catch {
      // Fallback: direct query if edge function returns different format
      try {
        const { data: orderData } = await supabase
          .from("orders")
          .select("id, status, fulfillment_status, shipping_snapshot, amount_total_paise, created_at")
          .order("created_at", { ascending: false })
          .limit(200);

        if (orderData) {
          // Fetch shipments for these orders
          const orderIds = orderData.map((o) => o.id);
          const { data: shipmentData } = await supabase
            .from("shipments")
            .select("id, order_id, awb_number, courier_name, tracking_url, shiprocket_order_id, label_url, label_generated_at, pickup_scheduled_date, manifest_url, manifested_at")
            .in("order_id", orderIds);

          const shipmentMap = new Map<string, typeof shipmentData extends (infer T)[] ? T : never>();
          for (const s of (shipmentData || [])) {
            if (!shipmentMap.has(s.order_id) || s.awb_number) {
              shipmentMap.set(s.order_id, s);
            }
          }

          const merged = orderData.map((o) => {
            const s = shipmentMap.get(o.id);
            return {
              ...o,
              shipment_id: s?.id,
              awb_number: s?.awb_number,
              courier_name: s?.courier_name,
              tracking_url: s?.tracking_url,
              shiprocket_order_id: s?.shiprocket_order_id,
              label_url: s?.label_url,
              label_generated_at: s?.label_generated_at,
              pickup_scheduled_date: s?.pickup_scheduled_date,
              manifest_url: s?.manifest_url,
              manifested_at: s?.manifested_at,
            } as AdminOrder;
          });

          setOrders(merged);
        }
      } catch (e) {
        toast.error("Failed to load orders");
      }
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // ── Fetch NDR queue ─────────────────────────────────────────────────────────
  const fetchNdrs = useCallback(async () => {
    if (!supabase) return;
    setNdrsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("get-ndr-queue", { body: {} });
      if (error) throw error;
      setNdrs((data?.ndrs || []) as NdrItem[]);
    } catch {
      toast.error("Failed to load NDR queue");
    } finally {
      setNdrsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      fetchOrders();
      fetchNdrs();
    }
  }, [user, isAdmin, fetchOrders, fetchNdrs]);

  // ── Admin action helper ─────────────────────────────────────────────────────
  const adminAction = async (key: string, fn: string, body: Record<string, unknown>, successMsg: string) => {
    if (!supabase) return;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const { data, error } = await supabase.functions.invoke(fn, { body });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Action failed");
      toast.success(successMsg);
      fetchOrders();
    } catch (err) {
      toast.error("Action failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // ── Order actions ───────────────────────────────────────────────────────────
  const handlePushToShipRocket = (order: AdminOrder) => {
    adminAction(`push-${order.id}`, "push-to-shiprocket", { orderId: order.id }, "Pushed to ShipRocket");
  };

  const handleGenerateLabel = (order: AdminOrder) => {
    if (!order.shipment_id) return;
    adminAction(`label-${order.id}`, "generate-label", { shipmentId: order.shipment_id }, "Label generated");
  };

  const handleSchedulePickup = () => {
    if (!pickupModal || !pickupDate) return;
    adminAction(
      `pickup-${pickupModal.orderId}`,
      "schedule-pickup",
      { shipmentId: pickupModal.shipmentId, pickupDate },
      "Pickup scheduled",
    );
    setPickupModal(null);
    setPickupDate("");
  };

  const handleGenerateManifest = (order: AdminOrder) => {
    if (!order.shipment_id) return;
    adminAction(`manifest-${order.id}`, "generate-manifest", { shipmentIds: [order.shipment_id] }, "Manifest generated");
  };

  // ── Bulk actions ────────────────────────────────────────────────────────────
  const handleBulkLabels = async () => {
    for (const id of selectedIds) {
      const order = orders.find((o) => o.id === id);
      if (order?.shipment_id && order.awb_number && !order.label_generated_at) {
        await adminAction(`label-${id}`, "generate-label", { shipmentId: order.shipment_id }, `Label: ${id.slice(0, 8)}`);
      }
    }
    setSelectedIds(new Set());
  };

  const handleBulkManifests = async () => {
    for (const id of selectedIds) {
      const order = orders.find((o) => o.id === id);
      if (order?.shipment_id && order.pickup_scheduled_date && !order.manifested_at) {
        await adminAction(`manifest-${id}`, "generate-manifest", { shipmentIds: [order.shipment_id] }, `Manifest: ${id.slice(0, 8)}`);
      }
    }
    setSelectedIds(new Set());
  };

  // ── NDR actions ─────────────────────────────────────────────────────────────
  const handleNdrReattempt = async (ndr: NdrItem) => {
    if (!supabase) return;
    setActionLoading((prev) => ({ ...prev, [`ndr-${ndr.ndrId}`]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("resolve-ndr", {
        body: { ndrId: ndr.ndrId, action: "reattempt" },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success("Re-attempt requested");
      setNdrs((prev) => prev.filter((n) => n.ndrId !== ndr.ndrId));
    } catch (err) {
      toast.error("Failed", { description: err instanceof Error ? err.message : "" });
    } finally {
      setActionLoading((prev) => ({ ...prev, [`ndr-${ndr.ndrId}`]: false }));
    }
  };

  const handleNdrUpdateAddress = async () => {
    if (!ndrAddressModal || !supabase) return;
    const key = `ndr-${ndrAddressModal.ndrId}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("resolve-ndr", {
        body: { ndrId: ndrAddressModal.ndrId, action: "update_address", newAddress: ndrAddress },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success("Address updated & re-attempt requested");
      setNdrs((prev) => prev.filter((n) => n.ndrId !== ndrAddressModal.ndrId));
      setNdrAddressModal(null);
    } catch (err) {
      toast.error("Failed", { description: err instanceof Error ? err.message : "" });
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleNdrCancelRto = async () => {
    if (!ndrConfirmRto || !supabase) return;
    const key = `ndr-${ndrConfirmRto.ndrId}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("resolve-ndr", {
        body: { ndrId: ndrConfirmRto.ndrId, action: "cancel_rto" },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success("Return accepted");
      setNdrs((prev) => prev.filter((n) => n.ndrId !== ndrConfirmRto.ndrId));
      setNdrConfirmRto(null);
    } catch (err) {
      toast.error("Failed", { description: err instanceof Error ? err.message : "" });
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // ── Reconciliation export ───────────────────────────────────────────────────
  const handleReconciliationDownload = async () => {
    if (!supabase) return;

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-reconciliation?month=${reconMonth}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
        },
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `reconciliation-${reconMonth}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Failed to download reconciliation CSV");
    }
  };

  // ── Filtered orders ─────────────────────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    if (!matchesFilter(o.fulfillment_status, filterTab)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        (o.awb_number || "").toLowerCase().includes(q) ||
        (o.shipping_snapshot?.name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stuckCount = orders.filter((o) => o.fulfillment_status === "manual_review" || o.fulfillment_status === "sr_push_failed").length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Orders</h1>
            <p className="text-xs md:text-sm text-muted-foreground">{orders.length} total</p>
          </div>
          <div className="hidden md:flex gap-2">
            <Button variant="outline" asChild><Link to="/">← Site</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/products">Products</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/wholesale-leads">Leads</Link></Button>
          </div>
        </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders" className="gap-1.5"><Package className="w-4 h-4" /> Orders</TabsTrigger>
          <TabsTrigger value="ndr" className="gap-1.5">
            <AlertTriangle className="w-4 h-4" /> NDR Queue
            {ndrs.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] h-5 min-w-5 justify-center">{ndrs.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5"><Download className="w-4 h-4" /> Reports</TabsTrigger>
        </TabsList>

        {/* ── ORDERS TAB ────────────────────────────────────────────────── */}
        <TabsContent value="orders" className="space-y-4">
          {/* Stuck orders alert */}
          {stuckCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{stuckCount} order{stuckCount > 1 ? "s" : ""} require manual attention</span>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => setFilterTab("stuck")}>View</Button>
            </div>
          )}

          {/* Search + filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search order ID, AWB, customer…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 min-h-[44px]"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => fetchOrders()} disabled={ordersLoading} className="min-h-[44px] min-w-[44px]">
              <RefreshCw className={`w-4 h-4 ${ordersLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-1.5">
            {FILTER_TABS.map((tab) => (
              <Button
                key={tab.key}
                variant={filterTab === tab.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterTab(tab.key)}
                className="text-xs"
              >
                {tab.label}
                {tab.key === "stuck" && stuckCount > 0 && (
                  <Badge variant="destructive" className="ml-1 text-[10px] h-4 min-w-4 justify-center">{stuckCount}</Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Bulk actions */}
          {selectedIds.size >= 2 && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button size="sm" variant="outline" onClick={handleBulkLabels}>
                <Tag className="w-3.5 h-3.5 mr-1.5" /> Generate Labels
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkManifests}>
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Generate Manifests
              </Button>
            </div>
          )}

          {/* Orders list */}
          {ordersLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No orders match this filter.</div>
          ) : isMobile ? (
            /* ── MOBILE: Card layout ────────────────────────────── */
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const statusConfig = STATUS_MAP[order.fulfillment_status] || STATUS_MAP.pending;
                const isActionLoading = actionLoading[`push-${order.id}`] || actionLoading[`label-${order.id}`] || actionLoading[`pickup-${order.id}`] || actionLoading[`manifest-${order.id}`];

                return (
                  <OrderCardMobile
                    key={order.id}
                    order={order}
                    statusConfig={statusConfig}
                    isLoading={!!isActionLoading}
                    onPush={() => handlePushToShipRocket(order)}
                    onLabel={() => handleGenerateLabel(order)}
                    onPickup={() => order.shipment_id && setPickupModal({ orderId: order.id, shipmentId: order.shipment_id })}
                    onManifest={() => handleGenerateManifest(order)}
                  />
                );
              })}
            </div>
          ) : (
            /* ── DESKTOP: Table layout ──────────────────────────── */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-2 w-8">
                      <Checkbox
                        checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-2">Order</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">AWB</th>
                    <th className="p-2">Courier</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const statusConfig = STATUS_MAP[order.fulfillment_status] || STATUS_MAP.pending;
                    const isLoading = actionLoading[`push-${order.id}`] || actionLoading[`label-${order.id}`] || actionLoading[`pickup-${order.id}`] || actionLoading[`manifest-${order.id}`];

                    return (
                      <tr key={order.id} className="border-b hover:bg-muted/30">
                        <td className="p-2">
                          <Checkbox
                            checked={selectedIds.has(order.id)}
                            onCheckedChange={() => toggleSelect(order.id)}
                          />
                        </td>
                        <td className="p-2">
                          <span className="font-mono text-xs">{order.id.slice(0, 8)}</span>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </p>
                        </td>
                        <td className="p-2">
                          <span className="text-xs">{order.shipping_snapshot?.name || "—"}</span>
                        </td>
                        <td className="p-2 font-medium text-xs tabular-nums">{formatPrice(order.amount_total_paise / 100)}</td>
                        <td className="p-2">
                          <Badge variant="secondary" className={`text-[10px] ${statusConfig.color}`}>
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {order.awb_number ? (
                            <span className="text-xs font-mono">{order.awb_number}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-2 text-xs">{order.courier_name || "—"}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}

                            {/* Push to ShipRocket */}
                            {(order.fulfillment_status === "sr_push_failed" || order.fulfillment_status === "manual_review") && (
                              <Button
                                size="sm" variant="outline" className="text-[10px] h-7 px-2"
                                onClick={() => handlePushToShipRocket(order)}
                                disabled={!!isLoading}
                              >
                                Push to SR
                              </Button>
                            )}

                            {/* Generate Label */}
                            {order.awb_number && !order.label_generated_at && (
                              <Button
                                size="sm" variant="outline" className="text-[10px] h-7 px-2"
                                onClick={() => handleGenerateLabel(order)}
                                disabled={!!isLoading}
                              >
                                <Tag className="w-3 h-3 mr-1" /> Label
                              </Button>
                            )}

                            {/* Schedule Pickup */}
                            {order.label_generated_at && !order.pickup_scheduled_date && order.shipment_id && (
                              <Button
                                size="sm" variant="outline" className="text-[10px] h-7 px-2"
                                onClick={() => setPickupModal({ orderId: order.id, shipmentId: order.shipment_id! })}
                                disabled={!!isLoading}
                              >
                                <Calendar className="w-3 h-3 mr-1" /> Pickup
                              </Button>
                            )}

                            {/* Generate Manifest */}
                            {order.pickup_scheduled_date && !order.manifested_at && (
                              <Button
                                size="sm" variant="outline" className="text-[10px] h-7 px-2"
                                onClick={() => handleGenerateManifest(order)}
                                disabled={!!isLoading}
                              >
                                <FileText className="w-3 h-3 mr-1" /> Manifest
                              </Button>
                            )}

                            {/* Track link */}
                            {order.tracking_url && (
                              <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[10px] text-primary hover:underline">
                                Track <ExternalLink className="w-3 h-3 ml-0.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── NDR QUEUE TAB ─────────────────────────────────────────── */}
        <TabsContent value="ndr" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">NDR Queue ({ndrs.length})</h2>
            <Button variant="outline" size="sm" onClick={fetchNdrs} disabled={ndrsLoading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${ndrsLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          {ndrsLoading ? (
            <div className="py-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" /></div>
          ) : ndrs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No pending NDR actions.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {ndrs.map((ndr) => {
                const isLoading = actionLoading[`ndr-${ndr.ndrId}`];

                return (
                  <Card key={ndr.ndrId}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{ndr.customerName || "Customer"}</p>
                          <p className="text-xs text-muted-foreground">{ndr.customerPhone}</p>
                        </div>
                        {ndr.autoRtoRisk && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-[10px]">
                            ⚠ Auto-RTO in &lt; 12h
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>AWB: <span className="font-mono">{ndr.awbNumber}</span> · {ndr.courierName}</p>
                        <p>Address: {ndr.shippingAddress}</p>
                        <p>Reason: <span className="font-medium text-foreground">{ndr.ndrReason}</span></p>
                        <p>Open: {ndr.hoursOpen}h</p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          size="sm" variant="outline" className="text-xs"
                          onClick={() => handleNdrReattempt(ndr)}
                          disabled={!!isLoading}
                        >
                          {isLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Truck className="w-3 h-3 mr-1" />}
                          Re-attempt
                        </Button>
                        <Button
                          size="sm" variant="outline" className="text-xs"
                          onClick={() => { setNdrAddressModal(ndr); setNdrAddress({ address: "", city: "", state: "", pincode: "" }); }}
                          disabled={!!isLoading}
                        >
                          Update Address
                        </Button>
                        <Button
                          size="sm" variant="outline" className="text-xs text-destructive border-destructive/30"
                          onClick={() => setNdrConfirmRto(ndr)}
                          disabled={!!isLoading}
                        >
                          Accept Return
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── REPORTS TAB ──────────────────────────────────────────── */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" /> Reconciliation Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Download monthly shipping reconciliation data as CSV.</p>
              <div className="flex items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reconMonth">Month</Label>
                  <Input
                    id="reconMonth"
                    type="month"
                    value={reconMonth}
                    onChange={(e) => setReconMonth(e.target.value)}
                    className="w-[180px]"
                  />
                </div>
                <Button onClick={handleReconciliationDownload}>
                  <Download className="w-4 h-4 mr-1.5" /> Download CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Pickup Date Modal ──────────────────────────────────────── */}
      <Dialog open={!!pickupModal} onOpenChange={(open) => { if (!open) setPickupModal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Pickup</DialogTitle>
            <DialogDescription>Select a pickup date for the courier.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="pickupDate">Pickup Date</Label>
            <Input id="pickupDate" type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickupModal(null)}>Cancel</Button>
            <Button onClick={handleSchedulePickup} disabled={!pickupDate}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── NDR Address Modal ──────────────────────────────────────── */}
      <Dialog open={!!ndrAddressModal} onOpenChange={(open) => { if (!open) setNdrAddressModal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Delivery Address</DialogTitle>
            <DialogDescription>Enter the corrected address. A re-delivery will also be requested.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Address *</Label>
              <Input value={ndrAddress.address} onChange={(e) => setNdrAddress((p) => ({ ...p, address: e.target.value }))} placeholder="Full address" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City *</Label>
                <Input value={ndrAddress.city} onChange={(e) => setNdrAddress((p) => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>State *</Label>
                <Input value={ndrAddress.state} onChange={(e) => setNdrAddress((p) => ({ ...p, state: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Pincode *</Label>
              <Input value={ndrAddress.pincode} onChange={(e) => setNdrAddress((p) => ({ ...p, pincode: e.target.value }))} maxLength={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNdrAddressModal(null)}>Cancel</Button>
            <Button
              onClick={handleNdrUpdateAddress}
              disabled={!ndrAddress.address || !ndrAddress.city || !ndrAddress.state || !ndrAddress.pincode}
            >
              Update & Re-attempt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── NDR RTO Confirm Modal ──────────────────────────────────── */}
      <Dialog open={!!ndrConfirmRto} onOpenChange={(open) => { if (!open) setNdrConfirmRto(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Return?</DialogTitle>
            <DialogDescription>This will initiate a return to origin. The customer will need to be refunded separately.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNdrConfirmRto(null)}>Go Back</Button>
            <Button variant="destructive" onClick={handleNdrCancelRto}>Confirm Accept Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
