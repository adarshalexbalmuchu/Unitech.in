import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";

/**
 * Full-width vibrant banner — "Deal of the Day" / flash-sale style.
 * Pure CSS + inline SVG, no external images required.
 */
const DealOfTheDayBanner = () => (
  <section className="relative w-full overflow-hidden" style={{ background: "#e8251a" }}>
    {/* Decorative circles */}
    <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-10" style={{ background: "#fff" }} />
    <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-10" style={{ background: "#fff" }} />
    <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full opacity-[0.06]" style={{ background: "#fff" }} />

    {/* Diagonal stripe */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 42px)",
      }}
    />

    <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-8 py-10 md:py-14 flex flex-col md:flex-row items-center gap-6 md:gap-12">
      {/* Left — icon cluster */}
      <div className="flex items-center justify-center shrink-0">
        <div className="relative w-24 h-24 md:w-32 md:h-32">
          {/* Pulsing ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: "2px solid rgba(255,255,255,0.25)",
              animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <Zap className="w-10 h-10 md:w-14 md:h-14 text-white" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Center — copy */}
      <div className="flex-1 text-center md:text-left">
        <p
          className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-2"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          Limited Time Only
        </p>
        <h2 className="text-[28px] md:text-[40px] font-extrabold text-white leading-[1.1] tracking-[-0.02em]">
          Deal of the Day
        </h2>
        <p className="mt-2 text-sm md:text-base text-white/75 max-w-md">
          Grab upto <span className="font-bold text-white">40% OFF</span> on select tower speakers &amp; home theatre systems. While stocks last!
        </p>
      </div>

      {/* Right — CTA */}
      <Link
        to="/products"
        className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-200 hover:scale-105"
        style={{ background: "#fff", color: "#e8251a" }}
      >
        Shop Now
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </section>
);

export default DealOfTheDayBanner;
