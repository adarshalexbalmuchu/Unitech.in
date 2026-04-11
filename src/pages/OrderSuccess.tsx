import { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Copy, Package, Truck, ExternalLink, Loader2 } from "lucide-react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/constants";
import { toast } from "sonner";

interface OrderData {
  id: string;
  status: string;
  fulfillment_status: string;
  cart_snapshot: Array<{ product_name?: string; quantity?: number; unit_price_paise?: number }>;
  shipping_snapshot: { name?: string; address?: string; city?: string; state?: string; pincode?: string; phone?: string; email?: string };
  amount_total_paise: number;
  amount_subtotal_paise: number;
  payment_method: string;
  created_at: string;
}

interface ShipmentData {
  id: string;
  awb_number: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  fulfillment_status: string;
  estimated_delivery: string | null;
}

const OrderSuccess = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [waitingForShipment, setWaitingForShipment] = useState(true);
  const [copied, setCopied] = useState(false);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [user, authLoading, navigate]);

  // Fetch order
  useEffect(() => {
    if (!orderId || !user || !supabase) return;

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, user_id, status, fulfillment_status, cart_snapshot, shipping_snapshot, amount_total_paise, amount_subtotal_paise, payment_method, created_at")
        .eq("id", orderId)
        .single();

      if (error || !data) {
        toast.error("Order not found");
        navigate("/", { replace: true });
        return;
      }

      // Verify ownership
      if (data.user_id && data.user_id !== user.id) {
        navigate("/", { replace: true });
        return;
      }

      setOrder(data as OrderData);
      setLoadingOrder(false);
    };

    fetchOrder();
  }, [orderId, user, navigate]);

  // Fetch existing shipment + Realtime subscription
  useEffect(() => {
    if (!orderId || !supabase) return;

    // Check for existing shipment
    const fetchShipment = async () => {
      const { data } = await supabase
        .from("shipments")
        .select("id, awb_number, courier_name, tracking_url, fulfillment_status, estimated_delivery")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setShipment(data as ShipmentData);
        setWaitingForShipment(false);
      }
    };

    fetchShipment();

    // Realtime subscription for shipments
    const channel = supabase
      .channel(`shipment-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shipments",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const row = payload.new as ShipmentData;
          if (row) {
            setShipment(row);
            setWaitingForShipment(false);
          }
        },
      )
      .subscribe();

    subscriptionRef.current = channel;

    // Stop waiting after 30 seconds
    waitTimerRef.current = setTimeout(() => {
      setWaitingForShipment(false);
    }, 30000);

    return () => {
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    };
  }, [orderId]);

  const handleCopyOrderId = async () => {
    if (!orderId) return;
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (authLoading || loadingOrder) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <StickyHeader />
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-20 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Loading order details...</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!order) return null;

  const shipping = order.shipping_snapshot || {};
  const cartItems = Array.isArray(order.cart_snapshot) ? order.cart_snapshot : [];
  const firstName = (shipping.name || "").split(" ")[0] || "Customer";

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StickyHeader />

      <div className="max-w-[800px] mx-auto px-4 md:px-6 pt-8 pb-16">
        {/* Top section — animated checkmark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/40 mb-4 animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Order Confirmed</h1>
          <button
            onClick={handleCopyOrderId}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span className="font-mono text-xs">{orderId}</span>
            <Copy className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
            {copied && <span className="text-green-600 text-xs">Copied!</span>}
          </button>
          <p className="text-muted-foreground mt-2">Thank you, {firstName}</p>
        </div>

        {/* Order summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cartItems.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.product_name || "Item"} × {item.quantity || 1}
                </span>
                <span className="font-medium tabular-nums">
                  {formatPrice(((item.unit_price_paise || 0) / 100) * (item.quantity || 1))}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatPrice(order.amount_subtotal_paise / 100)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">
                {order.amount_total_paise === order.amount_subtotal_paise
                  ? <span className="text-green-600">Free</span>
                  : formatPrice((order.amount_total_paise - order.amount_subtotal_paise) / 100)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-extrabold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.amount_total_paise / 100)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Payment</span>
              <Badge variant="outline" className="capitalize">{order.payment_method}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Shipping address */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{shipping.name}</p>
            <p className="text-sm text-muted-foreground">{shipping.address}</p>
            <p className="text-sm text-muted-foreground">
              {[shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(", ")}
            </p>
            {shipping.phone && <p className="text-sm text-muted-foreground mt-1">{shipping.phone}</p>}
          </CardContent>
        </Card>

        {/* Tracking section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" /> Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shipment && shipment.awb_number ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-medium">Shipped via {shipment.courier_name || "Courier"}</p>
                    <p className="text-sm text-muted-foreground font-mono">{shipment.awb_number}</p>
                  </div>
                  {shipment.tracking_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                        Track on courier site <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
                {shipment.estimated_delivery && (
                  <p className="text-sm text-muted-foreground">
                    Estimated delivery: {new Date(shipment.estimated_delivery).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            ) : waitingForShipment ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Your order is being packed. Tracking details will appear here shortly.</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your order is being packed. Tracking details will appear here shortly.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/">Continue Shopping</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/account/orders">View All Orders</Link>
          </Button>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default OrderSuccess;
