import { useState } from "react";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
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
  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useProductsByCollection(collection);

  const filteredProducts = products.filter((p) => p.category !== "power-accessories");
  const hasMore = filteredProducts.length > limit;
  const displayProducts = expanded ? filteredProducts : filteredProducts.slice(0, limit);

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error && err.message) return err.message;
    return "Unable to load products right now.";
  };

  return (
    <section className={cn("max-w-[1280px] mx-auto px-4 md:px-6 py-12 md:py-16", className)}>
      {/* ── Section header ── */}
      <div className="flex items-end justify-between mb-8 md:mb-10">
        <div>
          {/* Red accent line */}
          <div
            className="w-8 h-[3px] rounded-full mb-3"
            style={{ background: "hsl(357 100% 45%)" }}
          />
          <h2 className="text-[24px] md:text-[28px] font-extrabold text-foreground tracking-[-0.03em]">
            {title}
          </h2>
          {variant === "featured" && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              Hand-picked products our team loves
            </p>
          )}
          {variant === "new-arrivals" && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              Just landed in our catalog
            </p>
          )}
        </div>

        {hasMore && !isLoading && !isError && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0 pb-1"
          >
            {expanded ? "Show Less" : "See All"}
            {!expanded && <ArrowRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="rounded-2xl p-3 md:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={`${collection}-skeleton-${i}`} />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-muted/40 p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{getErrorMessage(error)}</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Retry
          </button>
        </div>
      ) : displayProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

          {/* See more */}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors duration-200"
                style={{
                  padding: "12px 32px",
                  border: "1.5px solid #111",
                  borderRadius: 6,
                  background: "transparent",
                  color: "#111",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#111"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#111"; }}
              >
                {expanded ? "Show Less" : `See ${filteredProducts.length - limit} More`}
                {!expanded && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No products in this section right now.
          </p>
        </div>
      )}
    </section>
  );
};

export default HomeCollectionSection;
