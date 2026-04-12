import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Package2 } from "lucide-react";
import { CATEGORIES, formatPrice, isPlaceholderImage, getCategoryFallbackImage } from "@/lib/constants";
import { useProducts, type Product } from "@/hooks/useProducts";

const highlightedCategorySlugs = [
  "tower-speakers",
  "home-theatre-systems",
  "appliances",
  "led-dth-stands",
] as const;

const IMAGE_CYCLE_MS = 2500;
const MAX_CYCLE_IMAGES = 4;

/** Override which product slug appears as the hero image per category */
const preferredProductSlug: Partial<Record<string, string>> = {
  appliances: "2200w-infrared-cooktop",
};

/* ── Cycling image sub-component ── */
const CyclingImage = ({ images, categorySlug, categoryLabel }: {
  images: { src: string; alt: string }[];
  categorySlug: string;
  categoryLabel: string;
}) => {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % images.length);
        setFading(false);
      }, 300);
    }, IMAGE_CYCLE_MS);
    return () => clearInterval(timer);
  }, [images.length]);

  const current = images[index];
  if (!current) {
    return (
      <img
        src={getCategoryFallbackImage(categorySlug)}
        alt={categoryLabel}
        className="w-full h-full object-cover"
      />
    );
  }

  return (
    <img
      src={current.src}
      alt={current.alt}
      className={`w-full h-full object-contain transition-all duration-300 group-hover:scale-105 ${fading ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      loading="lazy"
      onError={(e) => { e.currentTarget.src = getCategoryFallbackImage(categorySlug); }}
    />
  );
};

const BestSellingStores = () => {
  const { data: products = [], isLoading } = useProducts();
  const navigate = useNavigate();

  const categorySections = highlightedCategorySlugs
    .map((slug) => {
      const category = CATEGORIES.find((item) => item.slug === slug);
      if (!category) return null;
      const catProducts = products.filter((p) => p.category === slug);
      const preferred = preferredProductSlug[slug];

      // Sort by score for consistent ordering
      const sorted = [...catProducts].sort((a, b) => {
        const scoreA = Number(a.is_featured) * 1000 + a.reviews_count + a.rating * 10;
        const scoreB = Number(b.is_featured) * 1000 + b.reviews_count + b.rating * 10;
        return scoreB - scoreA;
      });

      // If there's a preferred product, put it first
      if (preferred) {
        const idx = sorted.findIndex((p) => p.slug === preferred);
        if (idx > 0) {
          const [item] = sorted.splice(idx, 1);
          sorted.unshift(item);
        }
      }

      // Pick up to MAX_CYCLE_IMAGES with real images
      const withImages = sorted.filter((p) => !isPlaceholderImage(p.image_url));
      const cycleItems = withImages.slice(0, MAX_CYCLE_IMAGES);

      return { category, items: cycleItems, topProduct: sorted[0] ?? null };
    })
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-12 md:py-16">
      {/* ── Section header ── */}
      <div className="flex items-end justify-between mb-8 md:mb-10">
        <div>
          <div className="w-8 h-[3px] rounded-full mb-3" style={{ background: "hsl(357 100% 45%)" }} />
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-[-0.03em]">
            Shop by Category
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Top products from our best-selling categories
          </p>
        </div>
        <Link
          to="/products/all"
          className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0 pb-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Category cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {categorySections.map(({ category, items, topProduct }) => {
          const Icon = category.icon;
          const images = items.map((p) => ({ src: p.image_url, alt: p.name }));

          return (
            <div
              key={category.slug}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/products/${category.slug}`)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(`/products/${category.slug}`); }}
              className="group bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden hover:shadow-[var(--vm-shadow-hover)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col cursor-pointer"
            >
              {/* ── Product image (cycling) ── */}
              <div className="bg-white aspect-[4/3] overflow-hidden">
                {isLoading ? (
                  <div className="w-full h-full animate-pulse bg-white/70" />
                ) : (
                  <CyclingImage
                    images={images}
                    categorySlug={category.slug}
                    categoryLabel={category.label}
                  />
                )}
              </div>

              {/* ── Info + top product price ── */}
              <div className="flex flex-col gap-3 p-3 md:p-4 flex-1">
                {/* Category identity */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[12px] md:text-[13px] leading-tight line-clamp-1">
                      {category.label}
                    </h3>
                    {!isLoading && topProduct && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                        from {formatPrice(topProduct.price ?? 0)}
                      </p>
                    )}
                  </div>
                </div>

                {/* CTA button */}
                <div
                  className="mt-auto flex items-center justify-between px-3 py-2 md:py-2.5 bg-[#111] text-white text-[11px] md:text-xs font-bold rounded-xl group-hover:bg-primary transition-colors duration-200"
                >
                  Shop Now
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </div>

              {/* ── Empty state ── */}
              {!isLoading && items.length === 0 && (
                <div className="absolute inset-x-3 bottom-16 flex flex-col items-center justify-center gap-1 py-4">
                  <Package2 className="w-5 h-5 text-muted-foreground/30" strokeWidth={1.5} />
                  <p className="text-[10px] text-muted-foreground/50">No products yet</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile CTA */}
      <div className="mt-8 flex justify-center md:hidden">
        <Link
          to="/products/all"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
        >
          View All Products <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

export default BestSellingStores;
