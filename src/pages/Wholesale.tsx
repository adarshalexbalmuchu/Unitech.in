import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Package, Zap, Store, Building2, Warehouse } from "lucide-react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";

const WHY_CARDS = [
  {
    icon: ShieldCheck,
    title: "30 Years of Market Trust",
    desc: "Established 1994. We've operated through every Indian market cycle — GST, demonetisation, COVID. Your supply relationship is stable.",
  },
  {
    icon: Package,
    title: "Complete Product Range",
    desc: "DTH systems, tower speakers, home theatre, car audio. One supplier, multiple categories.",
  },
  {
    icon: Zap,
    title: "Direct Pricing, Fast Supply",
    desc: "No middlemen. Pan-India distribution network with priority support for active partners.",
  },
];

const TIERS = [
  {
    icon: Store,
    title: "Retailer",
    desc: "Single store, local market presence",
  },
  {
    icon: Building2,
    title: "Dealer",
    desc: "Multi-location, regional reach",
  },
  {
    icon: Warehouse,
    title: "Distributor",
    desc: "State-level operations, bulk volumes",
  },
];

const TRUST_ITEMS = [
  "Trusted since 1994",
  "Pan-India Network",
  "20+ States",
  "1000+ Retail Partners",
];

const Wholesale = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <StickyHeader />

    {/* ── Section 1: Hero ── */}
    <section className="relative w-full overflow-hidden bg-[#0d0d0d]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(232,37,26,0.08) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-8 py-16 md:py-24 text-center">
        <h1 className="text-[32px] md:text-[52px] font-extrabold text-white leading-[1.1] tracking-[-0.02em]">
          Built for Retailers.
          <br />
          <span className="text-primary">Backed by 30 Years.</span>
        </h1>
        <p className="mt-4 text-sm md:text-base text-white/50 max-w-xl mx-auto leading-relaxed">
          Join Unitech India's distributor network. Premium audio and electronics,
          pan-India supply, direct factory pricing.
        </p>
        <Link
          to="/wholesale/apply"
          className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-md bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          Apply for Partnership
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="mt-3 text-xs text-white/30">No upfront fees. Quick onboarding.</p>
      </div>
    </section>

    {/* ── Section 2: Why Partner ── */}
    <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-14 md:py-20">
      <div className="text-center mb-10 md:mb-14">
        <div className="w-8 h-[3px] rounded-full mx-auto mb-4 bg-primary" />
        <h2 className="text-[24px] md:text-[28px] font-extrabold text-foreground tracking-[-0.02em]">
          Why Partner With Us
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {WHY_CARDS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl border border-border p-4 sm:p-6 hover:border-primary/20 transition-colors"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 bg-primary/10">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" strokeWidth={2} />
            </div>
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── Section 3: Who This Is For ── */}
    <section className="bg-muted/40 border-y border-border">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-14 md:py-20">
        <div className="text-center mb-10 md:mb-14">
          <div className="w-8 h-[3px] rounded-full mx-auto mb-4 bg-primary" />
          <h2 className="text-[24px] md:text-[28px] font-extrabold text-foreground tracking-[-0.02em]">
            Who This Is For
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-6">
          {TIERS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl bg-background border border-border p-3 sm:p-6 text-center hover:border-primary/20 transition-colors"
            >
              <div className="mx-auto w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 sm:mb-4 bg-primary/10">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">{title}</h3>
              <p className="hidden sm:block text-xs text-muted-foreground mt-1.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Section 4: Trust Bar ── */}
    <section className="border-b border-border">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
          {TRUST_ITEMS.map((item, i) => (
            <span key={item} className="flex items-center gap-3">
              {i > 0 && <span className="hidden sm:inline text-border">·</span>}
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>

    {/* ── Section 5: Final CTA ── */}
    <section className="relative overflow-hidden bg-primary">
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-10 bg-white" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-10 bg-white" />
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-16 text-center">
        <h2 className="text-[24px] md:text-[32px] font-extrabold text-primary-foreground tracking-tight">
          Ready to stock Unitech India?
        </h2>
        <Link
          to="/wholesale/apply"
          className="inline-flex items-center gap-2 mt-6 px-7 py-3.5 rounded-md bg-white text-primary font-bold text-sm hover:bg-white/90 transition-colors"
        >
          Apply Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>

    <SiteFooter />
  </div>
);

export default Wholesale;
