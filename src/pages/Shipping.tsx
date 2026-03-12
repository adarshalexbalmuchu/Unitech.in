import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { Truck, Package, Clock, MapPin } from "lucide-react";

const Shipping = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <StickyHeader />
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-6 flex items-center gap-3">
        <Truck className="w-7 h-7 text-primary" /> Shipping & Delivery
      </h1>

      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-2">
            <Package className="w-6 h-6 text-primary" />
            <h3 className="font-bold">Free Shipping</h3>
            <p className="text-sm text-muted-foreground">Free delivery on all orders across India. No minimum order value required.</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-5 space-y-2">
            <Clock className="w-6 h-6 text-primary" />
            <h3 className="font-bold">Delivery Time</h3>
            <p className="text-sm text-muted-foreground">Standard delivery within 5-7 business days. Metro cities may receive earlier.</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold">Shipping Policy</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>All orders are processed within <strong className="text-foreground">1-2 business days</strong> after payment confirmation. You will receive a tracking number via email once your order is shipped.</p>
            <p>We ship through trusted logistics partners to ensure safe delivery of your audio equipment. All products are carefully packaged with adequate cushioning to prevent damage during transit.</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold">Delivery Zones</h2>
          <div className="bg-muted rounded-lg p-5">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Metro Cities (Delhi, Mumbai, Bangalore, etc.)</span>
                <span className="font-semibold">3-5 days</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Tier 2 Cities</span>
                <span className="font-semibold">5-7 days</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Remote Areas</span>
                <span className="font-semibold">7-10 days</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold">Important Notes</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Please inspect the package at the time of delivery for any visible damage</li>
            <li>• If the outer packaging is damaged, please refuse delivery and notify us immediately</li>
            <li>• A valid phone number is required for delivery coordination</li>
            <li>• Delivery attempts will be made up to 3 times before the order is returned</li>
          </ul>
        </div>
      </div>
    </div>
    <SiteFooter />
  </div>
);

export default Shipping;
