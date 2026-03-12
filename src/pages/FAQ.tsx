import { useState } from "react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { HelpCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const faqs = [
  { q: "How do I track my order?", a: "Once your order is shipped, you'll receive a tracking number via email. You can use it on the courier partner's website to track delivery status." },
  { q: "What payment methods do you accept?", a: "We accept all major payment methods through Razorpay — UPI, credit/debit cards, net banking, and popular wallets like Paytm and PhonePe." },
  { q: "Do you offer EMI options?", a: "Yes, EMI options are available through Razorpay on select credit cards. You'll see available EMI plans during checkout." },
  { q: "How long does delivery take?", a: "Standard delivery takes 5-7 business days. Metro cities may receive orders within 3-5 days. Remote areas may take up to 10 days." },
  { q: "Can I cancel my order?", a: "Orders can be cancelled within 24 hours of placement. Once shipped, the order cannot be cancelled but you can initiate a return after delivery." },
  { q: "What if my product arrives damaged?", a: "If your product arrives damaged, please contact us within 48 hours with photos. We'll arrange a free pickup and send a replacement or full refund." },
  { q: "Do you ship outside India?", a: "Currently, we only ship within India. International shipping may be available in the future." },
  { q: "How do I claim warranty?", a: "Email us at unitechindia@gmail.com with your invoice, product model, and description of the issue. Our team will guide you through the process." },
  { q: "Are your products genuine?", a: "Absolutely. All products are manufactured by Unitech India and come with a 1-year manufacturer warranty and genuine invoice." },
  { q: "Can I visit a showroom?", a: "We primarily operate online for the best prices. Contact us for authorized dealer locations near you." },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = faqs.filter(
    (f) => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StickyHeader />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2 flex items-center gap-3">
          <HelpCircle className="w-7 h-7 text-primary" /> Frequently Asked Questions
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Find answers to common questions about orders, shipping, and more.</p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search FAQs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">No matching questions found.</p>
          ) : (
            filtered.map((faq, i) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-semibold pr-4">{faq.q}</span>
                  {open === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
                {open === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default FAQ;
