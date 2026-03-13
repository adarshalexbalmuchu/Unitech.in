import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, ShoppingCart, CreditCard, Truck, MapPin, Minus, Plus, Trash2 } from "lucide-react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { isPlaceholderImage, formatPrice } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (response: unknown) => void) => void;
    };
  }
}

type ShippingForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: { description?: string };
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Something went wrong during checkout.";
};

const normalizeShipping = (shipping: ShippingForm) => ({
  name: shipping.name.trim(),
  email: shipping.email.trim().toLowerCase(),
  phone: shipping.phone.replace(/\s+/g, "").trim(),
  address: shipping.address.trim(),
  city: shipping.city.trim(),
  state: shipping.state.trim(),
  pincode: shipping.pincode.trim().toUpperCase(),
});

const getCheckoutFingerprint = (cartItems: Array<{ product_id: string; quantity: number }>, shipping: ShippingForm) => {
  const normalizedItems = [...cartItems]
    .map((item) => ({ productId: item.product_id, quantity: item.quantity }))
    .sort((left, right) => left.productId.localeCompare(right.productId));

  return JSON.stringify({
    items: normalizedItems,
    shipping: normalizeShipping(shipping),
  });
};

const Checkout = () => {
  const { cartItems, cartTotal, cartCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const checkoutAttemptRef = useRef<{ fingerprint: string; key: string } | null>(null);

  const [form, setForm] = useState<ShippingForm>({
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const set = (key: keyof ShippingForm, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const isFormValid =
    form.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    /^[0-9+\-\s()]{8,20}$/.test(form.phone) &&
    form.address.trim().length >= 5 &&
    form.city.trim().length >= 2 &&
    form.state.trim().length >= 2 &&
    /^[0-9A-Za-z -]{4,10}$/.test(form.pincode);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error("Please log in to continue");
      navigate("/login");
      return;
    }

    if (!supabase) {
      toast.error("Checkout is not configured right now");
      return;
    }

    if (!cartItems.length) {
      toast.error("Your cart is empty");
      return;
    }

    if (!isFormValid) {
      toast.error("Please fill valid shipping details");
      return;
    }

    setLoading(true);

    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load Razorpay. Check your internet connection.");
        setLoading(false);
        return;
      }

      const checkoutFingerprint = getCheckoutFingerprint(cartItems, form);
      const existingAttempt = checkoutAttemptRef.current;
      const idempotencyKey = existingAttempt && existingAttempt.fingerprint === checkoutFingerprint
        ? existingAttempt.key
        : crypto.randomUUID();

      checkoutAttemptRef.current = {
        fingerprint: checkoutFingerprint,
        key: idempotencyKey,
      };

      const normalizedShipping = normalizeShipping(form);
      const payload = {
        idempotencyKey,
        items: cartItems.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
        })),
        shipping: normalizedShipping,
      };

      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: payload,
      });

      if (error || !data?.orderId || !data?.razorpayOrderId || !data?.keyId) {
        throw new Error(error?.message || data?.error || "Failed to create order");
      }

      const options = {
        key: data.keyId,
        amount: data.amountPaise,
        currency: data.currency,
        name: "Unitech India",
        description: `Order of ${cartCount} item${cartCount > 1 ? "s" : ""}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        notes: {
          shipping_address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
          app_order_id: data.orderId,
        },
        theme: {
          color: "#E63946",
        },
        handler: async function (response: RazorpaySuccessResponse) {
          try {
            const verifyResult = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                orderId: data.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            });

            if (verifyResult.error || verifyResult.data?.status !== "paid") {
              throw new Error(
                verifyResult.error?.message ||
                verifyResult.data?.error ||
                "Payment verification failed",
              );
            }

            clearCart();
            checkoutAttemptRef.current = null;
            toast.success("Payment verified successfully! 🎉", {
              description: `Payment ID: ${response.razorpay_payment_id}`,
            });
            navigate("/");
          } catch (verifyError: unknown) {
            console.error("Payment verification error:", verifyError);
            toast.error("Payment received but verification failed", {
              description: getErrorMessage(verifyError) || "Please contact support if amount was deducted.",
            });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast("Payment cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options as Record<string, unknown>);
      rzp.on("payment.failed", function (response: unknown) {
        const failureResponse = response as RazorpayFailureResponse;
        toast.error("Payment failed", {
          description: failureResponse?.error?.description || "Please try again.",
        });
        setLoading(false);
      });
      rzp.open();
    } catch (err: unknown) {
      console.error("Payment error:", err);
      toast.error("Payment error", { description: getErrorMessage(err) });
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <StickyHeader />
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-20 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" strokeWidth={1} />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some products before checking out</p>
          <Button asChild><Link to="/products/all">Browse Products</Link></Button>
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
          <span className="text-foreground font-medium">Checkout</span>
        </nav>

        <h1 className="text-xl md:text-2xl font-extrabold mb-6 flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-primary" /> Checkout
        </h1>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
          {/* Left: Shipping Details */}
          <div className="space-y-6">
            {/* Contact */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Shipping Details</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Your name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required placeholder="you@example.com" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea id="address" value={form.address} onChange={(e) => set("address", e.target.value)} required placeholder="House no., Street, Landmark..." rows={2} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} required placeholder="City" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state">State *</Label>
                    <Input id="state" value={form.state} onChange={(e) => set("state", e.target.value)} required placeholder="State" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pincode">PIN Code *</Label>
                    <Input id="pincode" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} required placeholder="110001" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cart Items */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" /> Cart Items ({cartCount})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 items-start py-2">
                    <div className="w-14 h-14 rounded-md bg-surface overflow-hidden flex items-center justify-center shrink-0">
                      {!isPlaceholderImage(item.product.image_url) ? (
                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingCart className="w-5 h-5 text-muted-foreground/30" strokeWidth={1} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-sm text-primary font-semibold">{formatPrice(item.product.price)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-0.5 rounded hover:bg-muted">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-0.5 rounded hover:bg-muted">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeFromCart(item.id)} className="ml-auto p-1 rounded hover:bg-destructive/10 text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-bold tabular-nums shrink-0">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:sticky lg:top-20 h-fit">
            <Card>
              <CardHeader><CardTitle className="text-lg">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({cartCount} items)</span>
                  <span className="font-medium">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-extrabold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(cartTotal)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Final payable amount is verified securely at checkout</p>
                <Button
                  className="w-full mt-3 gap-2 text-base py-6"
                  onClick={handlePayment}
                  disabled={loading || !isFormValid}
                >
                  <CreditCard className="w-5 h-5" />
                  {loading ? "Processing..." : `Pay ${formatPrice(cartTotal)}`}
                </Button>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-5 opacity-50" />
                  <span className="text-[10px] text-muted-foreground">Secured by Razorpay</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default Checkout;
