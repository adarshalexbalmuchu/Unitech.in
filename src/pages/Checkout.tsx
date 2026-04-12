import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, ShoppingCart, CreditCard, Truck, MapPin, Minus, Plus, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { useCart, useCartCount, useCartTotal } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { isPlaceholderImage, formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

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
  addressLine1: string;
  addressLine2: string;
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

const normalizeShipping = (shipping: ShippingForm) => ({
  name: shipping.name.trim(),
  email: shipping.email.trim().toLowerCase(),
  phone: shipping.phone.replace(/\s+/g, "").trim(),
  address: [shipping.addressLine1.trim(), shipping.addressLine2.trim()].filter(Boolean).join(", "),
  city: shipping.city.trim(),
  state: shipping.state.trim(),
  pincode: shipping.pincode.trim(),
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

const PINCODE_RE = /^[1-9][0-9]{5}$/;

type ServiceabilityResult = {
  serviceable: boolean;
  cheapestRate: number | null;
  etdDays: number | null;
} | null;

const Checkout = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const cartCount = useCartCount();
  const cartTotal = useCartTotal();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const checkoutAttemptRef = useRef<{ fingerprint: string; key: string } | null>(null);

  const [form, setForm] = useState<ShippingForm>({
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Pincode validation state
  const [pincodeError, setPincodeError] = useState("");
  const [pincodeVerified, setPincodeVerified] = useState(false);

  // Serviceability state
  const [serviceability, setServiceability] = useState<ServiceabilityResult>(null);
  const [serviceabilityChecked, setServiceabilityChecked] = useState(false);
  const serviceabilityPincodeRef = useRef("");

  const set = (key: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Reset pincode-related state when pincode changes
    if (key === "pincode") {
      setPincodeError("");
      setPincodeVerified(false);
      setServiceability(null);
      setServiceabilityChecked(false);
    }
  };

  const isPincodeValid = PINCODE_RE.test(form.pincode.trim());

  const isFormValid =
    form.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    /^[0-9+\-\s()]{8,20}$/.test(form.phone) &&
    form.addressLine1.trim().length >= 5 &&
    form.city.trim().length >= 2 &&
    form.state.trim().length >= 2 &&
    isPincodeValid;

  // Pincode is non-serviceable → block payment
  const isPaymentBlocked = serviceabilityChecked && serviceability !== null && !serviceability.serviceable;

  // Shipping cost calculation
  const isFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping
    ? 0
    : (serviceability?.serviceable && serviceability.cheapestRate != null)
      ? serviceability.cheapestRate
      : null;

  const orderTotal = shippingCost != null ? cartTotal + shippingCost : cartTotal;

  // ── Pincode blur handler ────────────────────────────────────────────────
  const handlePincodeBlur = useCallback(async () => {
    const pincode = form.pincode.trim();

    if (!pincode) {
      setPincodeError("");
      return;
    }

    if (!PINCODE_RE.test(pincode)) {
      setPincodeError("Enter a valid 6-digit pincode");
      setPincodeVerified(false);
      return;
    }

    setPincodeError("");

    // City/State autofill from free pincode API
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          setForm((prev) => ({
            ...prev,
            city: prev.city || po.District || "",
            state: prev.state || po.State || "",
          }));
          setPincodeVerified(true);
        }
      }
    } catch {
      // Silently skip autofill on failure
    }

    // Serviceability check (once per pincode)
    if (supabase && pincode !== serviceabilityPincodeRef.current) {
      serviceabilityPincodeRef.current = pincode;
      try {
        const { data, error } = await supabase.functions.invoke("check-serviceability", {
          body: { pincode, weight_kg: 0.5, cod: false },
        });
        if (!error && data) {
          setServiceability({
            serviceable: data.serviceable,
            cheapestRate: data.cheapest?.rate ?? null,
            etdDays: data.cheapest?.etdDays ?? null,
          });
          setServiceabilityChecked(true);
        }
      } catch {
        // Silently skip on error — do not block checkout
        setServiceabilityChecked(false);
      }
    }
  }, [form.pincode]);

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

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: payload,
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
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
          shipping_address: `${form.addressLine1}, ${form.addressLine2 ? form.addressLine2 + ", " : ""}${form.city}, ${form.state} - ${form.pincode}`,
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
            navigate(`/order-success/${data.orderId}`);
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
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input id="addressLine1" value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value.slice(0, 140))} required placeholder="House / Building / Flat No." maxLength={140} />
                  {form.addressLine1.length >= 100 && (
                    <p className="text-[10px] text-muted-foreground text-right">{form.addressLine1.length}/140</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="addressLine2">Address Line 2 <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input id="addressLine2" value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value.slice(0, 140))} placeholder="Street / Area / Landmark" maxLength={140} />
                  {form.addressLine2.length >= 100 && (
                    <p className="text-[10px] text-muted-foreground text-right">{form.addressLine2.length}/140</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pincode">PIN Code *</Label>
                    <Input
                      id="pincode"
                      value={form.pincode}
                      onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                      onBlur={handlePincodeBlur}
                      required
                      placeholder="110001"
                      maxLength={6}
                      inputMode="numeric"
                    />
                    {pincodeError && (
                      <p className="text-xs text-destructive">{pincodeError}</p>
                    )}
                    {pincodeVerified && !pincodeError && (
                      <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Pincode verified</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} required placeholder="City" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state">State *</Label>
                    <Input id="state" value={form.state} onChange={(e) => set("state", e.target.value)} required placeholder="State" />
                  </div>
                </div>

                {/* Serviceability result */}
                {serviceabilityChecked && serviceability && (
                  serviceability.serviceable ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm">
                      <Truck className="w-4 h-4 shrink-0" />
                      <span>Delivery available{serviceability.etdDays ? ` · Estimated ${serviceability.etdDays} days` : ""}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>We currently can't deliver to this pincode. Please try a different address.</span>
                    </div>
                  )
                )}
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
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted" aria-label="Decrease quantity">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted" aria-label="Increase quantity">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeFromCart(item.id)} className="ml-auto h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive" aria-label="Remove item">
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
                  {isFreeShipping ? (
                    <span className="font-medium text-green-600">Free</span>
                  ) : shippingCost != null ? (
                    <span className="font-medium">{formatPrice(shippingCost)}</span>
                  ) : (
                    <span className="font-medium text-muted-foreground">—</span>
                  )}
                </div>
                {!isFreeShipping && cartTotal > 0 && (
                  <p className="text-[10px] text-muted-foreground">Free shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}</p>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-extrabold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(orderTotal)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Final payable amount is verified securely at checkout</p>
                <Button
                  className="w-full mt-3 gap-2 text-base py-6"
                  onClick={handlePayment}
                  disabled={loading || !isFormValid || isPaymentBlocked}
                >
                  <CreditCard className="w-5 h-5" />
                  {loading ? "Processing..." : isPaymentBlocked ? "Delivery not available" : `Pay ${formatPrice(orderTotal)}`}
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
