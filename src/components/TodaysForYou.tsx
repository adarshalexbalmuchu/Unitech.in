import { useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { useProducts, useProductsByCollection } from "@/hooks/useProducts";

const tabs = [
  { label: "Hot Selling", collection: "hot-selling" as const },
  { label: "New Arrivals", collection: "new-arrivals" as const },
  { label: "Top Rated", collection: null },
  { label: "All Products", collection: null },
] as const;

const TodaysForYou = () => {
  const [active, setActive] = useState(0);
  const { data: allProducts = [] } = useProducts();
  const { data: hotSelling = [] } = useProductsByCollection("hot-selling");
  const { data: newArrivals = [] } = useProductsByCollection("new-arrivals");

  const topRated = useMemo(
    () => [...allProducts].sort((a, b) => b.rating - a.rating).slice(0, 8),
    [allProducts]
  );

  const displayProducts = useMemo(() => {
    switch (active) {
      case 0: return hotSelling;
      case 1: return newArrivals;
      case 2: return topRated;
      case 3: return allProducts.slice(0, 12);
      default: return allProducts;
    }
  }, [active, hotSelling, newArrivals, topRated, allProducts]);

  return (
    <section className="max-w-[1280px] mx-auto px-6 py-16">
      <div className="flex border-b border-border mb-8 overflow-x-auto scrollbar-none">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`px-8 py-4 text-base font-semibold whitespace-nowrap relative transition-colors ${
              i === active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {i === active && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
};

export default TodaysForYou;
