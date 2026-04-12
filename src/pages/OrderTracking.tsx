import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ChevronRight, Package, Truck, ExternalLink, Copy, Loader2, RefreshCw, AlertTriangle, CheckCircle2, MapPin, Clock } from "lucide-react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

// Fixed stepper steps
const STEPPER_STEPS = [
  { key: "placed", label: "Order Placed" },
  { key: "picked", label: "Picked Up" },
  { key: "transit", label: "In Transit" },
  { key: "ofd", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

function getStepperIndex(fulfillmentStatus: string): number {
  switch (fulfillmentStatus) {
    case "pending":
    case "sr_push_failed":
    case "manual_review":
    case "processing":
      return 0;
    case "shipped":
      return 2;
    case "out_for_delivery":
      return 3;
    case "delivered":
      return 4;
    case "ndr_pending":
      return 3;
    default:
      return -1; // returned/cancelled — no progress
  }
}

interface TrackingResponse {
  order: {
    id: string;
    status: string;
    fulfillmentStatus: string;
    createdAt: string;
  };
  shipments: Array<{
    id: string;
    awbNumber: string | null;
    courierName: string | null;
    trackingUrl: string | null;
    fulfillmentStatus: string;
    estimatedDelivery: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    timeline: Array<{
      date: string;
      activity: string;
      location: string;
    }>;
  }>;
  statusMessage: string;
  isTerminal: boolean;
}

const OrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [user, authLoading, navigate]);

  const fetchTracking = useCallback(async (isManual = false) => {
    if (!supabase || !orderId) return;
    if (isManual) setRefreshing(true); else setLoading(true);

    try {
      // supabase.functions.invoke doesn't support GET query params easily,
      // so we call directly with fetch
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { navigate("/login", { replace: true }); return; }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-shipment?orderId=${orderId}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
        },
      });

      if (res.status === 403) {
        toast.error("You don't have access to this order");
        navigate("/account/orders", { replace: true });
        return;
      }

      if (!res.ok) throw new Error("Failed to load tracking");

      const trackingData = await res.json() as TrackingResponse;
      setData(trackingData);
    } catch {
      if (!isManual) toast.error("Failed to load tracking details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    if (user && orderId) fetchTracking();
  }, [user, orderId, fetchTracking]);

  // Auto-refresh
  useEffect(() => {
    if (!data) return;

    // Clear existing interval
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);

    if (data.isTerminal) return; // No refresh for terminal orders

    const interval = data.shipments.length === 0 ? 60000 : 120000;
    autoRefreshRef.current = setInterval(() => fetchTracking(true), interval);

    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [data, fetchTracking]);

  const handleCopyAwb = async (awb: string) => {
    try {
      await navigator.clipboard.writeText(awb);
      toast.success("AWB copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar /><StickyHeader />
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-20 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Loading tracking details...</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!data) return null;

  const overallStatus = STATUS_MAP[data.order.fulfillmentStatus] || STATUS_MAP.pending;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StickyHeader />

      <div className="max-w-[900px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-12 md:pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] md:text-xs text-muted-foreground mb-4 md:mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/account/orders" className="hover:text-foreground transition-colors">Orders</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Tracking</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold flex items-center gap-3">
              <Package className="w-6 h-6 text-primary" />
              Order #{orderId?.slice(0, 8)}
            </h1>
            <Badge variant="secondary" className={`mt-2 ${overallStatus.color}`}>
              {overallStatus.label}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTracking(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* NDR banner */}
        {data.order.fulfillmentStatus === "ndr_pending" && (
          <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Delivery was attempted. The courier will try again.</span>
          </div>
        )}

        {/* RTO/returned banner */}
        {(data.order.fulfillmentStatus === "returned" || data.order.fulfillmentStatus === "rto") && (
          <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>This shipment is being returned.</span>
          </div>
        )}

        {/* Shipments */}
        {data.shipments.length > 0 ? (
          data.shipments.map((shipment, idx) => {
            const stepperIdx = getStepperIndex(shipment.fulfillmentStatus);

            return (
              <Card key={shipment.id} className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    {data.shipments.length > 1 ? `Shipment ${idx + 1}` : "Shipment Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Shipment info */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-sm font-medium">{shipment.courierName || "Courier"}</p>
                      {shipment.awbNumber && (
                        <button
                          onClick={() => handleCopyAwb(shipment.awbNumber!)}
                          className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5"
                        >
                          {shipment.awbNumber} <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {shipment.trackingUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                            Track on courier site <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {shipment.estimatedDelivery && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Estimated delivery: {new Date(shipment.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}

                  {/* Vertical stepper */}
                  {stepperIdx >= 0 && (
                    <div className="space-y-0">
                      {STEPPER_STEPS.map((step, i) => {
                        const reached = i <= stepperIdx;
                        return (
                          <div key={step.key} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full border-2 ${reached ? "bg-primary border-primary" : "bg-background border-muted-foreground/30"}`} />
                              {i < STEPPER_STEPS.length - 1 && (
                                <div className={`w-0.5 h-6 ${i < stepperIdx ? "bg-primary" : "bg-muted-foreground/20"}`} />
                              )}
                            </div>
                            <p className={`text-sm pb-3 ${reached ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Detailed timeline */}
                  {shipment.timeline.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Activity Log</p>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {shipment.timeline.map((event, i) => (
                          <div key={i} className={`flex gap-3 text-sm ${i === 0 ? "font-medium" : "text-muted-foreground"}`}>
                            <div className="shrink-0 w-[100px] text-xs tabular-nums">
                              {event.date ? new Date(event.date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                            </div>
                            <div className="flex-1">
                              <p>{event.activity}</p>
                              {event.location && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3" /> {event.location}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">{data.statusMessage}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link to="/account/orders">Back to My Orders</Link>
          </Button>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default OrderTracking;
