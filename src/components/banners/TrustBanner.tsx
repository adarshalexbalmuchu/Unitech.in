import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, Headphones } from "lucide-react";

/**
 * Trust / value-prop banner — highlights shipping, warranty, support.
 * Clean two-tone dark design with iconography.
 */

const FEATURES = [
  {
    icon: Truck,
    title: "Free Shipping",
    desc: "On orders above ₹999",
  },
  {
    icon: ShieldCheck,
    title: "1 Year Warranty",
    desc: "Hassle-free replacements",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Call, chat, or email us",
  },
] as const;

const TrustBanner = () => (
  <section className="relative w-full overflow-hidden" style={{ background: "#111" }}>
    {/* Subtle grid */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
    {/* Red glow */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 50% 70% at 50% 100%, rgba(232,37,26,0.08) 0%, transparent 70%)",
      }}
    />

    <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-8 py-10 md:py-14">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-10">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-4">
            <div
              className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(232,37,26,0.12)" }}
            >
              <Icon className="w-5 h-5" style={{ color: "#e8251a" }} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="text-xs text-white/45 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="w-full h-px my-8" style={{ background: "rgba(255,255,255,0.06)" }} />

      {/* Bottom row — CTA strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-white font-extrabold text-lg md:text-xl tracking-tight">
            Why <span style={{ color: "#e8251a" }}>25 Lakh+</span> customers trust Unitech
          </p>
          <p className="text-xs text-white/40 mt-1">Manufacturing premium audio equipment since 1994</p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 hover:scale-105"
          style={{ background: "#e8251a", color: "#fff" }}
        >
          Explore Products
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </section>
);

export default TrustBanner;
