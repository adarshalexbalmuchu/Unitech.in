import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { BorderBeam } from "@/components/ui/border-beam";
import { useProductsByCollection } from "@/hooks/useProducts";
import type { Collection } from "@/lib/constants";
import { cn } from "@/lib/utils";

type HomeCollectionSectionProps = {
  title: string;
  collection: Collection | Collection[];
  className?: string;
  limit?: number;
  variant?: "default" | "featured" | "new-arrivals";
};

const HomeCollectionSection = ({
  title,
  collection,
  className = "",
  limit = 8,
  variant = "default",
}: HomeCollectionSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const { data: products = [], isLoading, isError, error, refetch } = useProductsByCollection(collection);
  const hasMore = products.length > limit;
  const displayProducts = expanded ? products : products.slice(0, limit);

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error && err.message) return err.message;
    return "Unable to load products right now.";
  };

  const sectionContainerClass =
    variant === "featured"
      ? "relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-[1px] px-3 py-4 md:px-5 md:py-6 shadow-[0_8px_30px_hsl(var(--foreground)/0.04)]"
      : variant === "new-arrivals"
        ? "relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-background to-surface/30 px-3 py-4 md:px-5 md:py-6"
        : "";

  const titleClass =
    variant === "featured"
      ? "text-foreground"
      : variant === "new-arrivals"
        ? "text-foreground"
        : "";

  const cardFrameClass =
    variant === "featured"
      ? "rounded-xl bg-background/90 ring-1 ring-border/70 p-0.5"
      : variant === "new-arrivals"
        ? "rounded-xl bg-background ring-1 ring-border/50 p-0.5"
        : "";

  return (
    <section className={`max-w-[1280px] mx-auto px-4 md:px-6 py-10 md:py-14 ${className}`}>
      <div className={sectionContainerClass}>
        {(variant === "featured" || variant === "new-arrivals") && (
          <BorderBeam
            size={180}
            duration={variant === "featured" ? 12 : 16}
            borderWidth={1.25}
            anchor={variant === "featured" ? 70 : 45}
            colorFrom={variant === "featured" ? "hsl(var(--primary))" : "hsl(var(--border))"}
            colorTo={variant === "featured" ? "hsl(var(--ring))" : "hsl(var(--muted-foreground))"}
            className="opacity-60"
          />
        )}

        {variant === "featured" && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
          </>
        )}

        {variant === "new-arrivals" && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-border" />
        )}

        <div className="flex items-center justify-between mb-5 md:mb-6 relative z-10">
          <div className="flex items-center gap-2.5">
            <h2 className={cn("text-xl md:text-2xl font-extrabold", titleClass)}>{title}</h2>
            {variant === "featured" && (
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] md:text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Featured Picks
              </span>
            )}
            {variant === "new-arrivals" && (
              <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[10px] md:text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Latest Drops
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 relative z-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={`${collection}-skeleton-${i}`} />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-6 text-center space-y-3 relative z-10">
            <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Retry
            </button>
          </div>
        ) : displayProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 relative z-10">
              {displayProducts.map((product) => (
                <div key={product.id} className={cardFrameClass}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="mt-6 flex justify-center relative z-10">
                <button
                  onClick={() => setExpanded((value) => !value)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold transition-colors",
                    variant === "featured"
                      ? "border-primary/35 text-primary hover:bg-primary/10"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {expanded ? "Show Less" : `See More (${products.length - limit} more)`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface/40 p-6 text-center relative z-10">
            <p className="text-sm text-muted-foreground">No products available in this section right now.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeCollectionSection;
