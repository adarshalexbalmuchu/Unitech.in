import { Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { HelpCircle, FileText, Truck, RotateCcw, Shield, MessageSquare, BookOpen } from "lucide-react";

const helpLinks = [
  { icon: FileText, title: "FAQ", desc: "Find answers to common questions", to: "/faq" },
  { icon: Truck, title: "Shipping & Delivery", desc: "Track orders and delivery info", to: "/shipping" },
  { icon: RotateCcw, title: "Returns & Refunds", desc: "Return policy and how to return", to: "/returns" },
  { icon: Shield, title: "Warranty Info", desc: "Coverage and how to claim", to: "/warranty" },
  { icon: MessageSquare, title: "Contact Us", desc: "Get in touch with our team", to: "/contact" },
  { icon: BookOpen, title: "Privacy Policy", desc: "How we handle your data", to: "/privacy" },
];

const HelpCenter = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <StickyHeader />
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-2 flex items-center gap-3">
        <HelpCircle className="w-7 h-7 text-primary" /> Help Center
      </h1>
      <p className="text-sm text-muted-foreground mb-8">How can we help you today? Browse topics below or contact us directly.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {helpLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-start gap-4 p-5 bg-card rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <Icon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
    <SiteFooter />
  </div>
);

export default HelpCenter;
