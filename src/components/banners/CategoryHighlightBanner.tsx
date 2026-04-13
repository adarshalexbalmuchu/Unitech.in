import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Category highlight / lifestyle banner.
 * Desktop: full-width banner image. Mobile: copy + image stacked.
 */
const CategoryHighlightBanner = () => (
  <section className="relative w-full overflow-hidden">
    {/* Desktop — full banner image */}
    <div className="hidden md:block">
      <Link to="/products?category=tower-speakers">
        <img
          src="/banners/top-category.png"
          alt="Top Category – Tower Speakers"
          className="w-full h-auto object-cover"
          loading="lazy"
        />
      </Link>
    </div>

    {/* Mobile — stacked layout */}
    <div className="md:hidden bg-gradient-to-br from-[#fdf2f1] via-white to-[#fef6f0]">
      <img
        src="/banners/top-category.png"
        alt="Top Category – Tower Speakers"
        className="w-full h-auto object-cover"
        loading="lazy"
      />
      <div className="px-4 py-6">
        <span
          className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] mb-4"
          style={{ background: "rgba(232,37,26,0.08)", color: "#e8251a" }}
        >
          Top Category
        </span>
        <h2 className="text-[26px] font-extrabold text-[#111] leading-[1.1] tracking-[-0.02em]">
          Tower Speakers
        </h2>
        <p className="mt-3 text-sm text-[#111]/60 max-w-sm leading-relaxed">
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
    </div>
  </section>
);

export default CategoryHighlightBanner;
