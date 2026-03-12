import { Link } from "react-router-dom";
import { Package2 } from "lucide-react";
import { CATEGORIES, formatPrice, isPlaceholderImage } from "@/lib/constants";
import { useProducts } from "@/hooks/useProducts";

const highlightedCategorySlugs = [
  "tower-speakers",
  "home-theatre-systems",
  "car-audio",
  "dth-receivers",
] as const;

const BestSellingStores = () => {
  const { data: products = [], isLoading } = useProducts();

  const categorySections = highlightedCategorySlugs
    .map((slug) => {
      const category = CATEGORIES.find((item) => item.slug === slug);
      if (!category) return null;

      const items = products
        .filter((product) => product.category === slug)
        .sort((left, right) => {
          const leftScore = Number(left.is_featured) * 1000 + left.reviews_count + left.rating * 10;
          const rightScore = Number(right.is_featured) * 1000 + right.reviews_count + right.rating * 10;
          return rightScore - leftScore;
        })
        .slice(0, 3);

      return { category, items };
    })
    .filter((section): section is NonNullable<typeof section> => Boolean(section));

  return (
    <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-10 md:py-12 pb-16 md:pb-20">
      <h2 className="text-xl md:text-2xl font-extrabold mb-5 md:mb-6">Best Selling Categories</h2>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-primary/5 to-primary/15 rounded-xl p-6 md:p-8 flex flex-col justify-center items-center text-center vm-shadow outline outline-1 outline-border -outline-offset-1">
          <img src={`${import.meta.env.BASE_URL}unitech-logo.png`} alt="Unitech India" className="h-10 md:h-12 mb-3 md:mb-4" />
          <h3 className="text-lg md:text-xl font-extrabold text-primary mb-1 md:mb-2">Unitech India</h3>
          <p className="text-xs md:text-sm text-primary/70 font-medium">Live catalog picks from {products.length} active products</p>
          <p className="mt-2 text-[11px] md:text-xs text-muted-foreground max-w-[26ch]">
            Real products are now pulled into this section category-by-category instead of using placeholder cards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
          {categorySections.map(({ category, items }) => {
            const Icon = category.icon;

            return (
              <div
                key={category.slug}
                className="bg-card rounded-lg p-3 md:p-4 vm-shadow outline outline-1 outline-border -outline-offset-1"
              >
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-surface rounded-full flex justify-center items-center">
                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm md:text-base">{category.label}</h4>
                    <p className="text-[11px] md:text-xs text-muted-foreground">Top products from the current catalog</p>
                  </div>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="space-y-2 animate-pulse">
                        <div className="w-full aspect-square rounded-md bg-surface" />
                        <div className="h-3 rounded bg-surface" />
                        <div className="h-3 w-2/3 mx-auto rounded bg-surface" />
                      </div>
                    ))}
                  </div>
                ) : items.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {items.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.slug}`}
                        className="group flex flex-col gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <div className="w-full aspect-square bg-surface rounded-md overflow-hidden flex justify-center items-center border border-border/60 transition-colors group-hover:border-primary/30">
                          {!isPlaceholderImage(product.image_url) ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <Icon className="w-6 h-6 md:w-7 md:h-7 text-muted-foreground/35" strokeWidth={1.25} />
                          )}
                        </div>

                        <div className="space-y-1 text-center">
                          <p className="text-[10px] md:text-[11px] font-semibold leading-tight line-clamp-2 min-h-[2.5em] group-hover:text-primary transition-colors">
                            {product.name}
                          </p>
                          <span className="block text-[10px] md:text-xs font-bold tabular-nums text-foreground">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-28 rounded-md bg-surface/60 border border-dashed border-border flex flex-col items-center justify-center gap-2 text-center px-4">
                    <Package2 className="w-5 h-5 text-muted-foreground/60" strokeWidth={1.5} />
                    <p className="text-xs text-muted-foreground">No active products available in this category yet.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BestSellingStores;
