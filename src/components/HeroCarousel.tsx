import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { resolvePrimaryProductImage } from "@/lib/constants";

/* ── Animated audio spectrum bars ── */
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

/* ── Brand color tokens ── */
const RED = "#e8251a";
const AMBER = "#e8a020";
const BG = "#0d0d0d";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.45)";
const SURFACE = "rgba(255,255,255,0.04)";

/* ── Ticker items ── */
const TICKER_ITEMS = [
  "Free shipping on orders above ₹999",
  "1-year warranty on all products",
  "Trusted by 25 Lakh+ customers",
  "Easy EMI available",
  "COD available pan India",
];

/* ── Spotlight card with cycling images ── */
import type { Product } from "@/hooks/useProducts";

const SpotlightCard = ({ name, link, items, itemCount, minPrice }: {
  name: string;
  link: string;
  items: Product[];
  itemCount: number;
  minPrice: number | null;
}) => {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setFading(false);
      }, 250);
    }, 3000);
    return () => clearInterval(timer);
  }, [items.length]);

  const current = items[index];
  const img = current ? resolvePrimaryProductImage(current.image_url, current.category) : "";

  return (
    <Link
      to={link}
      className="group relative rounded-xl overflow-hidden flex flex-col hover:ring-1 hover:ring-white/20 transition-all"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: `0.5px solid rgba(255,255,255,0.1)` }}
    >
      {/* Image area — fills card, no dead space */}
      <div className="relative w-full flex items-center justify-center overflow-hidden" style={{ height: 110 }}>
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 60%, rgba(232,37,26,0.06), transparent 70%)`,
        }} />
        {current ? (
          <img
            src={img}
            alt={current.name}
            className={`max-h-[90px] object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-all duration-500 ease-out ${fading ? "opacity-0 scale-90" : "opacity-100 scale-100"}`}
            loading="lazy"
          />
        ) : (
          <div className="flex items-end gap-[2px] h-5" aria-hidden>
            {[40, 70, 55, 85, 45, 90, 60].map((h, i) => (
              <div key={i} className="w-[3px] rounded-t-[1px]" style={{ height: `${h}%`, background: `${RED}55` }} />
            ))}
          </div>
        )}
        {/* Image cycle dots */}
        {items.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {items.map((_, i) => (
              <div key={i} className="rounded-full transition-all duration-300" style={{
                width: i === index ? 12 : 4,
                height: 4,
                background: i === index ? RED : "rgba(255,255,255,0.2)",
              }} />
            ))}
          </div>
        )}
      </div>
      {/* Info row */}
      <div className="flex items-end justify-between gap-1 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-white text-xs font-bold truncate">{name}</p>
          {minPrice != null && (
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              From ₹{minPrice.toLocaleString("en-IN")}
            </p>
          )}
        </div>
        <span className="text-[10px] font-medium shrink-0 flex items-center gap-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
          {itemCount} items
          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
      </div>
    </Link>
  );
};

/* ── Hero Section ── */
const HeroCarousel = () => {
  const { data: products = [] } = useProducts();
  const hero = products.find((p) => p.name.toLowerCase().includes("8787")) || null;
  const heroImg = hero ? resolvePrimaryProductImage(hero.image_url, hero.category) : "";
  const heroPrice = hero ? `₹${(hero.discounted_price ?? hero.price ?? 0).toLocaleString("en-IN")}` : "";
  const heroOriginal = hero?.original_price ? `₹${hero.original_price.toLocaleString("en-IN")}` : "";
  const heroDiscount = hero?.price && hero?.original_price && hero.original_price > (hero.discounted_price ?? hero.price)
    ? Math.round(((hero.original_price - (hero.discounted_price ?? hero.price)) / hero.original_price) * 100)
    : 0;

  // Gather spotlight products for the bottom row (different categories for variety)
  const spotlightSlugs = ["tower-speakers", "audio-amplifiers"] as const;
  const spotlightProducts = spotlightSlugs.map((catSlug) => {
    const catProds = products.filter((p) => p.category === catSlug && p.is_active);
    // Pick up to 3 products with real images for cycling
    const withImages = catProds.filter((p) => p.image_url && !p.image_url.includes("placeholder"));
    return { slug: catSlug, items: withImages.slice(0, 3) };
  });

  return (
  <section className="hero-section relative w-full overflow-hidden" style={{ background: BG, minHeight: 480 }}>
    {/* Grid overlay */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(${BORDER} 1px, transparent 1px), linear-gradient(90deg, ${BORDER} 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }}
    />

    {/* ── Main 2-column grid ── */}
    <div className="relative z-10 max-w-[1280px] mx-auto w-full px-4 md:px-8 pt-8 md:pt-10 pb-16 md:pb-24 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">

      {/* ── Left column: Copy + CTAs ── */}
      <div className="flex flex-col items-start">

        {/* Pill badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8"
          style={{ border: `0.5px solid ${BORDER}`, background: SURFACE }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: RED }} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
            India's Premium Audio Brand — Est. 1994
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-[48px] md:text-[68px] lg:text-[80px] font-extrabold leading-[1.0] tracking-[-0.02em] select-none mb-5"
        >
          <span className="text-white">HEAR THE</span>
          <br />
          <span style={{ color: RED }}>DIFFERENCE.</span>
        </h1>

        {/* Subtext */}
        <p className="text-sm leading-relaxed max-w-[400px] mb-8" style={{ color: MUTED }}>
          Handcrafted speakers, amplifiers, and home theatres — trusted by
          professionals and music lovers across India for 30+&nbsp;years.
        </p>

        {/* CTA buttons */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/products/all"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0d0d0d] font-bold text-sm rounded-md hover:bg-white/90 transition-colors"
          >
            Shop Now
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
          <Link
            to="/wholesale"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-sm rounded-md transition-colors"
            style={{ border: `0.5px solid rgba(255,255,255,0.2)`, color: MUTED }}
          >
            Become a Partner
          </Link>
        </div>

        {/* Trust stats */}
        <div className="flex items-center gap-0">
          {[
            { num: "25L+", label: "Customers" },
            { num: "30 Yrs", label: "Experience" },
            { num: "200+", label: "Products" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col pr-5 md:pr-7"
              style={i > 0 ? { paddingLeft: "1.25rem", borderLeft: `0.5px solid ${BORDER}` } : undefined}
            >
              <span className="text-white text-base md:text-lg font-bold">{stat.num}</span>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right column: Product showcase ── */}
      <div className="hidden md:flex flex-col gap-3">

        {/* Featured product — large hero card */}
        <Link
          to={hero ? `/product/${hero.slug}` : "/products/home-theatre-systems"}
          className="group relative rounded-2xl overflow-hidden hover:ring-1 hover:ring-white/20 transition-all"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)", border: `0.5px solid rgba(255,255,255,0.1)` }}
        >
          {/* Radial glow behind product */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse 60% 50% at 50% 55%, ${RED}15, transparent 70%)`,
          }} />

          {/* Product image — large, edge-to-edge */}
          <div className="relative w-full flex items-center justify-center px-6 pt-6 pb-2" style={{ height: 280 }}>
            {hero ? (
              <img
                src={heroImg}
                alt={hero.name}
                className="max-w-full max-h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] group-hover:scale-[1.07] transition-transform duration-700 ease-out"
              />
            ) : (
              <svg width="120" height="120" viewBox="0 0 80 80" fill="none" aria-hidden>
                <rect x="30" y="10" width="20" height="50" rx="3" fill="rgba(255,255,255,0.08)" />
                <rect x="10" y="25" width="14" height="30" rx="3" fill="rgba(255,255,255,0.06)" />
                <rect x="56" y="25" width="14" height="30" rx="3" fill="rgba(255,255,255,0.06)" />
                <rect x="24" y="62" width="32" height="6" rx="3" fill="rgba(255,255,255,0.05)" />
              </svg>
            )}
            {/* Discount badge — floating */}
            {heroDiscount > 0 && (
              <span
                className="absolute top-4 right-4 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg shadow-lg"
                style={{ background: RED, color: "#fff" }}
              >
                {heroDiscount}% OFF
              </span>
            )}
          </div>

          {/* Product info overlay — pinned to bottom */}
          <div className="relative px-5 pb-4 pt-2">
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                <h3 className="text-white text-[15px] font-bold leading-tight truncate">{hero?.name || "8787 Home Theatre"}</h3>
                <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {hero?.model_number || "Home Theatre System"} · {hero?.brand || "Unitech"}
                </p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-xl font-extrabold leading-none" style={{ color: RED }}>{heroPrice || "₹5,799"}</span>
                {heroOriginal && heroOriginal !== heroPrice && (
                  <span className="text-[11px] line-through mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{heroOriginal}</span>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                {hero?.is_featured && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded" style={{ color: RED, background: `${RED}18` }}>
                    Bestseller
                  </span>
                )}
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded" style={{ color: "#4ade80", background: "rgba(74,222,128,0.1)" }}>
                  Free Shipping
                </span>
              </div>
              <span className="text-[11px] font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: "rgba(255,255,255,0.6)" }}>
                View <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </Link>

        {/* Bottom row — category spotlight cards with cycling images */}
        <div className="grid grid-cols-2 gap-3">
          {spotlightProducts.map((spot) => {
            const catName = spot.slug === "tower-speakers" ? "Tower Speakers" : "Amplifiers";
            const catLink = `/products/${spot.slug}`;
            const catProds = products.filter((p) => p.category === spot.slug && p.is_active);
            const minPrice = catProds.length ? Math.min(...catProds.map((p) => p.price ?? Infinity)) : null;

            return (
              <SpotlightCard
                key={spot.slug}
                name={catName}
                link={catLink}
                items={spot.items}
                itemCount={catProds.length}
                minPrice={minPrice}
              />
            );
          })}
        </div>
      </div>
    </div>

    {/* ── Equalizer bar visualizer (full bleed) ── */}
    <div className="relative z-10 pb-4 w-full">
      <AudioBars />
    </div>

    {/* ── Bottom ticker strip ── */}
    <div className="relative z-10 overflow-hidden" style={{ background: BG, borderTop: `0.5px solid ${BORDER}` }}>
      <div className="flex animate-ticker whitespace-nowrap py-2.5">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="inline-flex items-center shrink-0 mx-4">
            <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>{item}</span>
            <span className="rounded-full ml-8 shrink-0" style={{ width: 6, height: 6, background: AMBER, opacity: 0.7 }} />
          </span>
        ))}
      </div>
    </div>

    {/* Animations */}
    <style>{`
      @keyframes ticker {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .animate-ticker {
        animation: ticker 30s linear infinite;
      }
      @keyframes barPulse {
        0% { transform: scaleY(1); }
        100% { transform: scaleY(0.4); }
      }
    `}</style>
  </section>
  );
};

export default HeroCarousel;
