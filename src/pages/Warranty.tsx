import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "react-router-dom";
import { Shield, CheckCircle, Clock, Wrench } from "lucide-react";

const Warranty = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <StickyHeader />
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-6 flex items-center gap-3">
        <Shield className="w-7 h-7 text-primary" /> Warranty Information
      </h1>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5 text-primary" /> Standard Warranty</h2>
          <p className="text-sm text-muted-foreground">All Unitech products come with a <strong className="text-foreground">1-year manufacturer warranty</strong> from the date of purchase, covering defects in materials and workmanship.</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-bold">What's Covered</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" /> Manufacturing defects in speakers, amplifiers, and electronic components</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" /> Faulty wiring and internal circuit failures</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" /> Defective buttons, knobs, and control panels</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" /> Power supply unit defects</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-bold">What's Not Covered</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Physical damage caused by misuse, accidents, or unauthorized modifications</li>
            <li>• Damage from power surges or voltage fluctuations (use a surge protector!)</li>
            <li>• Normal wear and tear including cosmetic deterioration</li>
            <li>• Accessories such as cables, remotes, and batteries</li>
          </ul>
        </div>

        <div className="bg-muted rounded-lg p-5 space-y-3">
          <h3 className="text-base font-bold flex items-center gap-2"><Wrench className="w-5 h-5 text-primary" /> How to Claim Warranty</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
            <li>Keep your purchase invoice — it's your warranty proof</li>
            <li>Contact us via email at <strong className="text-foreground">unitechindia@gmail.com</strong></li>
            <li>Provide your order details, product model, and a description of the issue</li>
            <li>Our team will guide you through the repair or replacement process</li>
          </ol>
        </div>

        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p>Warranty claims are typically processed within 7-14 business days.</p>
        </div>
      </div>
    </div>
    <SiteFooter />
  </div>
);

export default Warranty;
