import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { useProductsByCollection } from "@/hooks/useProducts";
import type { Collection } from "@/lib/constants";

type HomeCollectionSectionProps = {
  title: string;
  collection: Collection;
  className?: string;
  limit?: number;
};

const HomeCollectionSection = ({
  title,
  collection,
  className = "",
  limit = 8,
}: HomeCollectionSectionProps) => {
  const { data: products = [], isLoading } = useProductsByCollection(collection);
  const displayProducts = products.slice(0, limit);

  return (
    <section className={`max-w-[1280px] mx-auto px-4 md:px-6 py-10 md:py-14 ${className}`}>
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <h2 className="text-xl md:text-2xl font-extrabold">{title}</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={`${collection}-skeleton-${i}`} />
          ))}
        </div>
      ) : displayProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">No products available in this section right now.</p>
        </div>
      )}
    </section>
  );
};

export default HomeCollectionSection;
