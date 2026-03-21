import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const FooterBanner = () => (
  <section
    className="relative w-full overflow-hidden py-16 md:py-24"
    style={{ background: "#0D0D0D" }}
  >
    {/* Dot grid */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />
    {/* Vignette */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, #0D0D0D 100%)",
      }}
    />

    <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-6 flex flex-col items-center text-center gap-5 md:gap-6">
      <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] text-white/30">
        Unitech India
      </p>
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[0.95] tracking-[-0.03em]">
        Unitech hai jahan,<br />
        <span style={{ color: "hsl(357 100% 45%)" }}>Music hai vahan.</span>
      </h2>
      <p className="text-sm text-white/40 max-w-[40ch]">
        Premium audio equipment. Crafted for India. Trusted since 1999.
      </p>
      <Link
        to="/products/all"
        className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0D0D0D] font-bold text-sm rounded-md hover:bg-white/90 transition-colors"
      >
        Explore Our Products
        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
      </Link>
    </div>
  </section>
);

export default FooterBanner;
