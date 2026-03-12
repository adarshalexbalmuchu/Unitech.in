import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <StickyHeader />
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

      <div className="space-y-6 text-sm text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Information We Collect</h2>
          <p>When you visit our website or make a purchase, we collect certain information including your name, email address, phone number, shipping address, and payment information. We also collect device and browsing data automatically through cookies.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. How We Use Your Information</h2>
          <ul className="space-y-1 pl-4">
            <li>• Process and fulfill your orders</li>
            <li>• Send order confirmations and shipping updates</li>
            <li>• Respond to customer service requests</li>
            <li>• Improve our website and product offerings</li>
            <li>• Send promotional communications (with your consent)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Information Security</h2>
          <p>We implement industry-standard security measures to protect your personal information. Payment processing is handled securely through Razorpay, and we do not store your credit card or banking details on our servers.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Third-Party Services</h2>
          <p>We use trusted third-party services for payment processing (Razorpay), analytics, and shipping logistics. These services have their own privacy policies and we encourage you to review them.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">5. Cookies</h2>
          <p>We use cookies to enhance your browsing experience, remember your preferences, and analyze site traffic. You can disable cookies through your browser settings, though some features may not work properly.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">6. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information. To exercise these rights, contact us at <strong className="text-foreground">unitechindia@gmail.com</strong>.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">7. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">8. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at <strong className="text-foreground">unitechindia@gmail.com</strong>.</p>
        </section>
      </div>
    </div>
    <SiteFooter />
  </div>
);

export default Privacy;
