import { Link } from "react-router-dom";
import { ArrowRight, Package2 } from "lucide-react";
import { CATEGORIES, formatPrice, isPlaceholderImage, getCategoryFallbackImage } from "@/lib/constants";
import { useProducts } from "@/hooks/useProducts";

const highlightedCategorySlugs = [
  "tower-speakers",
  "home-theatre-systems",
  "appliances",
  "dth",
] as const;

const BestSellingStores = () => {
  const { data: products = [], isLoading } = useProducts();

  const categorySections = highlightedCategorySlugs
    .map((slug) => {
      const category = CATEGORIES.find((item) => item.slug === slug);
      if (!category) return null;
      const items = products
        .filter((p) => p.category === slug)
        .sort((a, b) => {
          const scoreA = Number(a.is_featured) * 1000 + a.reviews_count + a.rating * 10;
          const scoreB = Number(b.is_featured) * 1000 + b.reviews_count + b.rating * 10;
          return scoreB - scoreA;
        })
        .slice(0, 3);
      return { category, items };
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
        {categorySections.map(({ category, items }) => {
          const Icon = category.icon;

          return (
            <div
              key={category.slug}
              className="group bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden hover:shadow-[var(--vm-shadow-hover)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
            >
              {/* ── Product image mosaic ── */}
              <div className="bg-[#F5F5F5] p-2.5 md:p-3 flex gap-1.5 md:gap-2">
                {isLoading ? (
                  <>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex-1 aspect-square rounded-xl bg-white/70 animate-pulse"
                      />
                    ))}
                  </>
                ) : items.length > 0 ? (
                  <>
                    {items.map((product) => (
                      <div
                        key={product.id}
                        className="flex-1 aspect-square rounded-xl bg-white overflow-hidden flex items-center justify-center"
                      >
                        {!isPlaceholderImage(product.image_url) ? (
                          <img
                            src={product.image_url ?? ""}
                            alt={product.name}
                            className="w-full h-full object-contain p-1.5 md:p-2 transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = getCategoryFallbackImage(category.slug); }}
                          />
                        ) : (
                          <img
                            src={getCategoryFallbackImage(category.slug)}
                            alt={category.label}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                    {/* Pad to always show 3 slots */}
                    {Array.from({ length: Math.max(0, 3 - items.length) }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="flex-1 aspect-square rounded-xl bg-white/40 flex items-center justify-center"
                      >
                        <Icon className="w-5 h-5 text-muted-foreground/20" strokeWidth={1.25} />
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex-1 aspect-square rounded-xl bg-white/40 flex items-center justify-center"
                      >
                        <Icon className="w-5 h-5 text-muted-foreground/20" strokeWidth={1.25} />
                      </div>
                    ))}
                  </>
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
                    {!isLoading && items.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                        from {formatPrice(Math.min(...items.map(p => p.price ?? Infinity)))}
                      </p>
                    )}
                  </div>
                </div>

                {/* CTA button */}
                <Link
                  to={`/products/${category.slug}`}
                  className="mt-auto flex items-center justify-between px-3 py-2 md:py-2.5 bg-[#111] text-white text-[11px] md:text-xs font-bold rounded-xl hover:bg-primary transition-colors duration-200 group/btn"
                >
                  Shop Now
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                </Link>
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
