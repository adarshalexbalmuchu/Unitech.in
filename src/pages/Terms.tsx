import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <StickyHeader />
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

      <div className="space-y-6 text-sm text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>By accessing and using the Unitech India website, you agree to be bound by these Terms of Service. If you do not agree, please discontinue use of the website.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Products & Pricing</h2>
          <p>All product descriptions, images, and specifications are as accurate as possible. Prices are listed in Indian Rupees (INR) and are exclusive of applicable taxes. We reserve the right to modify prices without prior notice.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Orders & Payment</h2>
          <p>By placing an order, you confirm that the information provided is accurate. We reserve the right to cancel orders due to pricing errors, stock unavailability, or suspected fraudulent activity. Payments are processed securely through Razorpay.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Shipping & Delivery</h2>
          <p>Estimated delivery times are approximate and may vary based on location and logistics. Unitech India is not responsible for delays caused by courier partners, natural disasters, or unforeseen circumstances.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">5. Returns & Refunds</h2>
          <p>Returns are accepted within 7 days of delivery as per our Returns Policy. Refunds are processed to the original payment method within 5-7 business days after the returned product is received and inspected.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">6. Intellectual Property</h2>
          <p>All content on this website including logos, images, text, and designs are the property of Unitech India and are protected by copyright laws. Unauthorized use is strictly prohibited.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">7. Limitation of Liability</h2>
          <p>Unitech India shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website. Our maximum liability is limited to the purchase price of the product.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">8. Governing Law</h2>
          <p>These terms are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of Indian courts.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">9. Contact</h2>
          <p>For any questions regarding these Terms, please contact us at <strong className="text-foreground">unitechindia@gmail.com</strong>.</p>
        </section>
      </div>
    </div>
    <SiteFooter />
  </div>
);

export default Terms;
