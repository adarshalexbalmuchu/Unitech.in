import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/* ── Animated audio spectrum bars ─────────────────────────── */
const BAR_HEIGHTS = [
  28, 62, 44, 78, 52, 91, 36, 73, 58, 86, 42, 67, 82, 31, 69,
  48, 94, 39, 63, 77, 45, 70, 54, 89, 34, 74, 59, 84, 29, 66,
  47, 80, 37, 71, 55, 88, 43, 65, 79, 33, 76, 50, 92, 40, 68,
];

const AudioBars = () => (
  <div
    className="flex items-end w-full gap-[2px] md:gap-[3px]"
    style={{ height: 56 }}
    aria-hidden
  >
    {BAR_HEIGHTS.map((h, i) => {
      const isRed = i === 5 || i === 12 || i === 21 || i === 32 || i === 40;
      const duration = 0.7 + (i % 7) * 0.14;
      const delay = i * 0.035;
      return (
        <div
          key={i}
          className="flex-1 rounded-t-[1px] origin-bottom"
          style={{
            height: `${h}%`,
            background: isRed ? "hsl(357 100% 45%)" : "rgba(255,255,255,0.14)",
            animation: `barPulse ${duration}s ${delay}s ease-in-out infinite alternate`,
          }}
        />
      );
    })}
  </div>
);

/* ── Hero Section ─────────────────────────────────────────── */
const HeroCarousel = () => (
  <section
    className="relative w-full overflow-hidden flex flex-col"
    style={{ background: "#0D0D0D" }}
  >
    {/* Dot-grid background (Nothing-style) */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.065) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />

    {/* Radial vignette to keep edges dark */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, #0D0D0D 100%)",
      }}
    />

    {/* Bottom fade into white */}
    <div
      className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
      style={{
        background: "linear-gradient(to bottom, transparent, #0D0D0D 85%)",
      }}
    />

    {/* ── Main content ── */}
    <div className="relative z-10 max-w-[1280px] mx-auto w-full px-4 md:px-6 pt-16 md:pt-24 lg:pt-28 pb-10 md:pb-14 flex flex-col items-center text-center">

      {/* Label badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-8 md:mb-10">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "hsl(357 100% 45%)" }}
        />
        <span className="text-[10px] md:text-[11px] font-semibold text-white/50 uppercase tracking-[0.14em]">
          India's Premier Audio Brand — Est. 1999
        </span>
      </div>

      {/* Headline */}
      <h1
        className="text-[52px] sm:text-[68px] md:text-[80px] lg:text-[96px] xl:text-[108px] font-extrabold text-white leading-[0.92] tracking-hero mb-6 md:mb-8 select-none"
      >
        HEAR THE<br />
        <span style={{ color: "hsl(357 100% 45%)" }}>DIFFERENCE.</span>
      </h1>

      {/* Sub-headline */}
      <p className="text-sm md:text-base text-white/45 max-w-[46ch] leading-relaxed mb-10 md:mb-12">
        Handcrafted audio equipment — speakers, amplifiers, home theatres — trusted
        by professionals and music lovers across India for 25 years.
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
        <Link
          to="/products/all"
          className="inline-flex items-center gap-2 px-6 py-3 md:px-7 md:py-3.5 bg-white text-[#0D0D0D] font-bold text-sm rounded-md hover:bg-white/90 transition-colors"
        >
          Shop Now
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </Link>
        <Link
          to="/products/tower-speakers"
          className="inline-flex items-center gap-2 px-6 py-3 md:px-7 md:py-3.5 border border-white/20 text-white/75 font-semibold text-sm rounded-md hover:bg-white/6 hover:text-white transition-colors"
        >
          Explore Products
        </Link>
      </div>
    </div>

    {/* ── Audio spectrum bars ── */}
    <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 md:px-6 pb-0">
      <AudioBars />
    </div>
  </section>
);

export default HeroCarousel;
