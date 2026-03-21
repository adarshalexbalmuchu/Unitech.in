import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/* ── Brand tokens ── */
const RED = "#e8251a";
const BG = "#0d0d0d";

/* ── Animated audio spectrum bars (same as hero) ── */
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
            background: isRed ? "#e8251a" : "#333",
            animation: `barPulse ${duration}s ${delay}s ease-in-out infinite alternate`,
          }}
        />
      );
    })}
  </div>
);

const FooterBanner = () => (
  <section
    className="cta-section relative w-full overflow-hidden"
    style={{
      background: BG,
      padding: "80px 40px",
      borderBottom: `0.5px solid rgba(255,255,255,0.06)`,
    }}
  >
    {/* Grid overlay — matches hero */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }}
    />

    {/* Faint red radial glow */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(ellipse 60% 40% at 50% 50%, rgba(232,37,26,0.06) 0%, transparent 70%)`,
      }}
    />

    {/* Content */}
    <div className="relative z-10 flex flex-col items-center text-center">
      {/* Label */}
      <p
        className="text-[10px] font-semibold uppercase mb-6"
        style={{ letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)" }}
      >
        Unitech India
      </p>

      {/* Headline */}
      <h2
        className="text-[36px] md:text-[56px] font-extrabold select-none"
        style={{ lineHeight: 1.1, letterSpacing: "-0.02em" }}
      >
        <span className="text-white">Unitech hai jahan,</span>
        <br />
        <span style={{ color: RED }}>Music hai vahan.</span>
      </h2>

      {/* Subtext */}
      <p
        className="text-sm mt-4 mb-8"
        style={{ color: "rgba(255,255,255,0.45)", maxWidth: 420 }}
      >
        Premium audio equipment. Crafted for India. Trusted since 1994.
      </p>

      {/* CTA */}
      <Link
        to="/products/all"
        className="inline-flex items-center gap-2 text-sm font-medium text-white transition-colors"
        style={{
          padding: "12px 28px",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 6,
          background: "transparent",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        Explore Our Products
        <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </Link>

      {/* Animated equalizer bars — full width like the hero */}
      <div className="mt-10" style={{ width: "100%", maxWidth: 600 }}>
        <AudioBars />
      </div>
    </div>

    {/* barPulse keyframe */}
    <style>{`
      @keyframes barPulse {
        0% { transform: scaleY(1); }
        100% { transform: scaleY(0.4); }
      }
    `}</style>
  </section>
);

export default FooterBanner;
