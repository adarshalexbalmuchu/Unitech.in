import { Link } from "react-router-dom";
import { ArrowRight, Speaker, Music } from "lucide-react";

/**
 * Category highlight / lifestyle banner.
 * Split design — left has copy, right has decorative audio-themed SVG illustration.
 */
const CategoryHighlightBanner = () => (
  <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#fdf2f1] via-white to-[#fef6f0]">
    {/* Decorative dot pattern */}
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.35]"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />

    <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-8 py-10 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
      {/* Left — Copy */}
      <div className="order-2 md:order-1">
        <span
          className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] mb-4"
          style={{ background: "rgba(232,37,26,0.08)", color: "#e8251a" }}
        >
          Top Category
        </span>
        <h2 className="text-[26px] md:text-[36px] font-extrabold text-[#111] leading-[1.1] tracking-[-0.02em]">
          Tower Speakers
        </h2>
        <p className="mt-3 text-sm md:text-base text-[#111]/60 max-w-sm leading-relaxed">
          Experience cinema-grade audio at home. Our tower speakers deliver deep bass, crystal highs, and room-filling sound.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Link
            to="/products?category=tower-speakers"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 hover:scale-105"
            style={{ background: "#111", color: "#fff" }}
          >
            Browse Collection
            <ArrowRight className="w-4 h-4" />
          </Link>
          <span className="text-xs font-semibold text-[#111]/35">Starting at ₹4,999</span>
        </div>
      </div>

      {/* Right — Decorative illustration */}
      <div className="order-1 md:order-2 flex items-center justify-center">
        <div className="relative w-56 h-56 md:w-72 md:h-72">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: "2px dashed rgba(232,37,26,0.15)" }}
          />
          {/* Inner ring */}
          <div
            className="absolute inset-6 rounded-full"
            style={{ border: "1.5px solid rgba(232,37,26,0.1)", background: "rgba(232,37,26,0.03)" }}
          />
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Speaker className="w-16 h-16 md:w-20 md:h-20" style={{ color: "#e8251a" }} strokeWidth={1.5} />
          </div>
          {/* Floating music notes */}
          <div
            className="absolute top-4 right-6"
            style={{ animation: "float 3s ease-in-out infinite" }}
          >
            <Music className="w-5 h-5 text-[#e8251a]/30" />
          </div>
          <div
            className="absolute bottom-8 left-4"
            style={{ animation: "float 3s 1s ease-in-out infinite" }}
          >
            <Music className="w-4 h-4 text-[#e8251a]/20" />
          </div>
          {/* Sound wave arcs */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 200 200"
            fill="none"
          >
            <path
              d="M140 60 C170 80, 170 120, 140 140"
              stroke="rgba(232,37,26,0.12)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M152 48 C190 75, 190 125, 152 152"
              stroke="rgba(232,37,26,0.07)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  </section>
);

export default CategoryHighlightBanner;
