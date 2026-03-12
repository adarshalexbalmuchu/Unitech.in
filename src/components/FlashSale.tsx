import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import { useProductsByCollection } from "@/hooks/useProducts";

const FlashSale = () => {
  const { data: products = [] } = useProductsByCollection("flash-sale");
  const [time, setTime] = useState(2 * 3600 + 45 * 60 + 30);

  useEffect(() => {
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(Math.floor(time / 3600)).padStart(2, "0");
  const m = String(Math.floor((time % 3600) / 60)).padStart(2, "0");
  const s = String(time % 60).padStart(2, "0");

  if (products.length === 0) return null;

  return (
    <section className="py-12 bg-secondary/50">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex items-center gap-6 mb-6">
          <h2 className="text-2xl font-extrabold flex items-center gap-2">⚡ Flash Sale</h2>
          <div className="flex gap-1.5 items-center tabular-nums">
            <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-sm font-bold">{h}</span>
            <span className="text-destructive font-bold">:</span>
            <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-sm font-bold">{m}</span>
            <span className="text-destructive font-bold">:</span>
            <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-sm font-bold">{s}</span>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory p-1 -m-1">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} compact />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlashSale;
