import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { RotateCcw, CheckCircle, XCircle } from "lucide-react";

const Returns = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <StickyHeader />
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-6 flex items-center gap-3">
        <RotateCcw className="w-7 h-7 text-primary" /> Returns & Refunds
      </h1>

      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
          <h2 className="text-lg font-bold mb-2">7-Day Return Policy</h2>
          <p className="text-sm text-muted-foreground">We offer a hassle-free <strong className="text-foreground">7-day return window</strong> from the date of delivery. If you're not satisfied with your purchase, we'll make it right.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary" /> Eligible for Return</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Product received is damaged or defective</li>
              <li>• Wrong product delivered</li>
              <li>• Product not matching description</li>
              <li>• Missing parts or accessories</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold flex items-center gap-2"><XCircle className="w-5 h-5 text-destructive" /> Not Eligible</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Product damaged by customer misuse</li>
              <li>• Returned after 7 days of delivery</li>
              <li>• Product without original packaging</li>
              <li>• Products with tampered serial numbers</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold">How to Initiate a Return</h2>
          <ol className="space-y-3 text-sm text-muted-foreground list-decimal pl-5">
            <li>Email us at <strong className="text-foreground">unitechindia@gmail.com</strong> with your order number and reason for return</li>
            <li>Our team will review and approve your return request within 24 hours</li>
            <li>Pack the product in its original packaging with all accessories</li>
            <li>Our pickup partner will collect the product from your address</li>
            <li>Refund will be processed within 5-7 business days after we receive the product</li>
          </ol>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold">Refund Policy</h2>
          <div className="bg-muted rounded-lg p-5 space-y-2 text-sm text-muted-foreground">
            <p>• Refunds are credited back to the original payment method</p>
            <p>• Bank processing may take an additional 3-5 business days</p>
            <p>• Shipping charges (if any) are non-refundable</p>
            <p>• Replacement will be provided if the same product is available in stock</p>
          </div>
        </div>
      </div>
    </div>
    <SiteFooter />
  </div>
);

export default Returns;
