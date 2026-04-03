import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Speaker,
  ShieldCheck,
  Users,
  Award,
  Factory,
  Calendar,
  Headphones,
  Truck,
} from "lucide-react";

const MILESTONES = [
  { year: "1994", title: "Founded", desc: "Unitech India established in Delhi as a small electronics workshop." },
  { year: "2002", title: "First Factory", desc: "Opened our own manufacturing unit for audio amplifiers and speakers." },
  { year: "2010", title: "Pan-India Reach", desc: "Expanded dealer network to 500+ retailers across 18 states." },
  { year: "2018", title: "Digital Leap", desc: "Launched our e-commerce platform to serve customers directly." },
  { year: "2024", title: "50K+ Customers", desc: "Crossed 50,000 happy customers with 4-star average ratings." },
];

const VALUES = [
  {
    icon: Award,
    title: "Quality First",
    desc: "Every product undergoes rigorous quality checks before leaving our facility.",
  },
  {
    icon: Factory,
    title: "Made in India",
    desc: "Proudly designed and manufactured in India, supporting local craftsmanship.",
  },
  {
    icon: ShieldCheck,
    title: "1-Year Warranty",
    desc: "All products come with a hassle-free warranty and dedicated service support.",
  },
  {
    icon: Truck,
    title: "Pan-India Delivery",
    desc: "Free shipping on orders above ₹999, with COD available across India.",
  },
];

const STATS = [
  { value: "30+", label: "Years in Business" },
  { value: "50,000+", label: "Happy Customers" },
  { value: "500+", label: "Retail Partners" },
  { value: "200+", label: "Products" },
];

const About = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <StickyHeader />

    {/* ── Hero Section ── */}
    <section className="relative overflow-hidden" style={{ background: "#0d0d0d" }}>
      {/* Grid overlay */}
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
        <span
          className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] mb-5"
          style={{ background: "rgba(232,37,26,0.12)", color: "#e8251a" }}
        >
          About Us
        </span>
        <h1 className="text-[32px] md:text-[52px] font-extrabold text-white leading-[1.1] tracking-[-0.02em]">
          Unitech hai jahan,
          <br />
          <span style={{ color: "#e8251a" }}>Music hai vahan</span>
        </h1>
        <p className="mt-4 text-sm md:text-base text-white/50 max-w-xl mx-auto leading-relaxed">
          Manufacturing premium audio equipment and electronics since 1994.
          From a small workshop in Delhi to a trusted pan-India brand — our journey
          has been powered by passion for sound and commitment to quality.
        </p>
      </div>
    </section>

    {/* ── Stats Strip ── */}
    <section className="border-b border-border">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
        {STATS.map(({ value, label }) => (
          <div key={label} className="text-center">
            <p className="text-[28px] md:text-[36px] font-extrabold tracking-tight" style={{ color: "#e8251a" }}>
              {value}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── Our Story ── */}
    <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-14 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Left — illustration */}
        <div className="flex items-center justify-center">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            <div className="absolute inset-0 rounded-full" style={{ border: "2px dashed rgba(232,37,26,0.15)" }} />
            <div className="absolute inset-8 rounded-full" style={{ border: "1.5px solid rgba(232,37,26,0.1)", background: "rgba(232,37,26,0.03)" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Speaker className="w-20 h-20 md:w-24 md:h-24" style={{ color: "#e8251a" }} strokeWidth={1.2} />
            </div>
            {/* Decorative icons */}
            <div className="absolute top-6 right-8" style={{ animation: "float 3s ease-in-out infinite" }}>
              <Headphones className="w-6 h-6 text-[#e8251a]/25" />
            </div>
            <div className="absolute bottom-10 left-6" style={{ animation: "float 3s 1.2s ease-in-out infinite" }}>
              <Calendar className="w-5 h-5 text-[#e8251a]/20" />
            </div>
          </div>
        </div>

        {/* Right — copy */}
        <div>
          <div className="w-8 h-[3px] rounded-full mb-4" style={{ background: "#e8251a" }} />
          <h2 className="text-[24px] md:text-[32px] font-extrabold text-foreground tracking-[-0.02em] leading-[1.15]">
            Our Story
          </h2>
          <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
            Unitech India was born in 1994 out of a small workshop in Delhi, with a simple mission — to make premium
            audio accessible to every Indian household. What started with repairing and assembling amplifiers quickly
            grew into a full-fledged manufacturing operation.
          </p>
          <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
            Over the past three decades, we've expanded into tower speakers, home theatre systems, car audio, DTH
            receivers, TV kits, and power accessories. Today, Unitech products are trusted by over 50,000 customers
            and available through 500+ retail partners across India.
          </p>
          <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
            We don't just sell electronics — we engineer experiences. Every product is designed with the Indian
            consumer in mind: durable, feature-rich, and great value for money.
          </p>
        </div>
      </div>
    </section>

    {/* ── Timeline ── */}
    <section className="bg-muted/40 border-y border-border">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-14 md:py-20">
        <div className="text-center mb-10 md:mb-14">
          <div className="w-8 h-[3px] rounded-full mx-auto mb-4" style={{ background: "#e8251a" }} />
          <h2 className="text-[24px] md:text-[28px] font-extrabold text-foreground tracking-[-0.02em]">Our Journey</h2>
          <p className="mt-2 text-sm text-muted-foreground">Key milestones in our 30+ year history</p>
        </div>
        <div className="relative">
          {/* Vertical line (desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-8 md:space-y-0">
            {MILESTONES.map((m, i) => (
              <div
                key={m.year}
                className={`relative md:grid md:grid-cols-2 md:gap-12 ${i > 0 ? "md:mt-12" : ""}`}
              >
                {/* Dot on timeline */}
                <div className="hidden md:block absolute left-1/2 top-1 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-[#e8251a] bg-background z-10" />

                {/* Content — alternate sides */}
                {i % 2 === 0 ? (
                  <>
                    <div className="md:text-right md:pr-10">
                      <span className="text-xs font-bold" style={{ color: "#e8251a" }}>{m.year}</span>
                      <h3 className="text-base font-bold text-foreground mt-1">{m.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
                    </div>
                    <div className="hidden md:block" />
                  </>
                ) : (
                  <>
                    <div className="hidden md:block" />
                    <div className="md:pl-10">
                      <span className="text-xs font-bold" style={{ color: "#e8251a" }}>{m.year}</span>
                      <h3 className="text-base font-bold text-foreground mt-1">{m.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ── Values ── */}
    <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-14 md:py-20">
      <div className="text-center mb-10 md:mb-14">
        <div className="w-8 h-[3px] rounded-full mx-auto mb-4" style={{ background: "#e8251a" }} />
        <h2 className="text-[24px] md:text-[28px] font-extrabold text-foreground tracking-[-0.02em]">What We Stand For</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {VALUES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl border border-border p-6 text-center hover:border-[#e8251a]/20 transition-colors"
          >
            <div
              className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "rgba(232,37,26,0.08)" }}
            >
              <Icon className="w-5 h-5" style={{ color: "#e8251a" }} strokeWidth={2} />
            </div>
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── CTA ── */}
    <section className="relative overflow-hidden" style={{ background: "#e8251a" }}>
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-10 bg-white" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-10 bg-white" />
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-16 text-center">
        <h2 className="text-[24px] md:text-[32px] font-extrabold text-white tracking-tight">
          Ready to experience Unitech?
        </h2>
        <p className="mt-2 text-sm text-white/70 max-w-md mx-auto">
          Explore our full range of audio equipment and electronics.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Link
            to="/products/all"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-200 hover:scale-105"
            style={{ background: "#fff", color: "#e8251a" }}
          >
            Browse Products
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-200 hover:scale-105 border-2 border-white/30 text-white hover:bg-white/10"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
);

export default About;
