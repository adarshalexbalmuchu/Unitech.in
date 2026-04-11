import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, ChevronRight, Truck, XCircle, Loader2, ChevronLeft, ChevronRight as ChevronR } from "lucide-react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/constants";
import { toast } from "sonner";

const PAGE_SIZE = 10;

// Fulfillment status → display config
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:          { label: "Processing",          color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  sr_push_failed:   { label: "Processing",          color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  processing:       { label: "Preparing",           color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  shipped:          { label: "Shipped",             color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  out_for_delivery: { label: "Out for Delivery",    color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  delivered:        { label: "Delivered",            color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  ndr_pending:      { label: "Delivery Attempted",  color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  returned:         { label: "Returned",            color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  rto:              { label: "Returned",            color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  cancelled:        { label: "Cancelled",           color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  manual_review:    { label: "Processing",          color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

const TRACK_ELIGIBLE = ["shipped", "out_for_delivery", "delivered", "ndr_pending", "rto", "returned"];
const CANCEL_ELIGIBLE = ["pending", "processing", "sr_push_failed"];

interface OrderRow {
  id: string;
  status: string;
  fulfillment_status: string;
  cart_snapshot: Array<{ name?: string; quantity?: number }>;
  amount_total_paise: number;
  payment_method: string;
  cancellation_deadline: string | null;
  created_at: string;
}

const MyOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [user, authLoading, navigate]);

  const fetchOrders = useCallback(async (pageNum: number) => {
    if (!supabase || !user) return;
    setLoading(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE;

    const { data, error } = await supabase
      .from("orders")
      .select("id, status, fulfillment_status, cart_snapshot, amount_total_paise, payment_method, cancellation_deadline, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      toast.error("Failed to load orders");
      setLoading(false);
      return;
    }

    // If we got PAGE_SIZE+1 results there are more pages
    if (data && data.length > PAGE_SIZE) {
      setHasMore(true);
      setOrders(data.slice(0, PAGE_SIZE) as OrderRow[]);
    } else {
      setHasMore(false);
      setOrders((data || []) as OrderRow[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchOrders(page);
  }, [user, page, fetchOrders]);

  // Realtime subscription for fulfillment status updates
  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase
      .channel("my-orders-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as OrderRow;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)),
          );
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleCancelOrder = async () => {
    if (!cancelTarget || !supabase) return;
    setCancelling(true);

    try {
      const { data, error } = await supabase.functions.invoke("cancel-order", {
        body: { orderId: cancelTarget },
      });

      if (error || !data?.cancelled) {
        throw new Error(data?.error || error?.message || "Cancel failed");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === cancelTarget ? { ...o, fulfillment_status: "cancelled" } : o)),
      );
      toast.success("Order cancelled");
    } catch (err) {
      toast.error("Failed to cancel order", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  const canCancel = (order: OrderRow) => {
    if (!CANCEL_ELIGIBLE.includes(order.fulfillment_status)) return false;
    if (!order.cancellation_deadline) return true;
    return new Date(order.cancellation_deadline) > new Date();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar /><StickyHeader />
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-20 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StickyHeader />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-12 md:pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] md:text-xs text-muted-foreground mb-4 md:mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/account" className="hover:text-foreground transition-colors">Account</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Orders</span>
        </nav>

        <h1 className="text-xl md:text-2xl font-extrabold mb-6 flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" /> My Orders
        </h1>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" strokeWidth={1} />
            <h2 className="text-lg font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Your orders will appear here after you make a purchase.</p>
            <Button asChild><Link to="/products/all">Browse Products</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const items = Array.isArray(order.cart_snapshot) ? order.cart_snapshot : [];
              const firstItem = items[0]?.name || "Item";
              const moreCount = items.length - 1;
              const statusConfig = STATUS_MAP[order.fulfillment_status] || STATUS_MAP.pending;
              const paymentBadge = order.status === "paid"
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : order.status === "failed"
                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

              return (
                <Card key={order.id}>
                  <CardContent className="p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">
                          {firstItem}{moreCount > 0 ? ` + ${moreCount} more` : ""}
                        </p>
                        <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(order.amount_total_paise / 100)}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <Badge variant="secondary" className={`text-[11px] ${paymentBadge}`}>
                          {order.status === "paid" ? "Paid" : order.status === "failed" ? "Failed" : "Pending"}
                        </Badge>
                        <Badge variant="secondary" className={`text-[11px] ${statusConfig.color}`}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 flex-wrap">
                      {TRACK_ELIGIBLE.includes(order.fulfillment_status) && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/track/${order.id}`} className="gap-1.5">
                            <Truck className="w-3.5 h-3.5" /> Track Order
                          </Link>
                        </Button>
                      )}
                      {canCancel(order) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => setCancelTarget(order.id)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5" /> Cancel Order
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page + 1}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
              >
                Next <ChevronR className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>This cannot be undone. Your payment will be refunded if applicable.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelling}>
              Go Back
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={cancelling}>
              {cancelling ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelling...</> : "Confirm Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
};

export default MyOrders;
