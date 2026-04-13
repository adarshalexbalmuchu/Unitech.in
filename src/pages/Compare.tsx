import { Link } from "react-router-dom";
import { X, GitCompareArrows, ShoppingCart } from "lucide-react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { useCompare } from "@/hooks/useCompare";
import { useCart } from "@/hooks/useCart";
import { formatPrice, CATEGORIES, ensureHttps } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Compare = () => {
  const { compareProducts, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();

  // Collect all unique spec keys across compared products
  const allSpecKeys = Array.from(
    new Set(compareProducts.flatMap((p) => Object.keys(p.specs || {})))
  );

  const handleAddToCart = (p: typeof compareProducts[0]) => {
    addToCart(p.id, { name: p.name, price: p.discounted_price ?? p.price ?? 0, image_url: p.image_url });
    toast.success("Added to cart", { description: p.name });
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StickyHeader />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-12 md:pb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <GitCompareArrows className="w-6 h-6 text-primary" />
            <h1 className="text-xl md:text-2xl font-extrabold">Compare Products</h1>
            <span className="text-sm text-muted-foreground">({compareProducts.length}/4)</span>
          </div>
          {compareProducts.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearCompare}>Clear All</Button>
          )}
        </div>

        {compareProducts.length === 0 ? (
          <div className="text-center py-20">
            <GitCompareArrows className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" strokeWidth={1} />
            <p className="text-lg font-semibold text-muted-foreground mb-2">No products to compare</p>
            <p className="text-sm text-muted-foreground mb-6">Add products from the listing page to compare them side-by-side</p>
            <Button asChild><Link to="/products/all">Browse Products</Link></Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-muted/50 rounded-tl-lg w-40 text-xs font-bold uppercase tracking-wider text-muted-foreground">Feature</th>
                  {compareProducts.map((p) => (
                    <th key={p.id} className="p-3 bg-muted/50 text-center min-w-[180px]">
                      <div className="relative">
                        <button
                          onClick={() => removeFromCompare(p.id)}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-destructive/10 text-destructive rounded-full flex items-center justify-center hover:bg-destructive/20"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-20 h-20 mx-auto mb-2 bg-surface rounded-md overflow-hidden flex items-center justify-center">
                          {p.image_url && !p.image_url.includes("placeholder") ? (
                            <img src={ensureHttps(p.image_url)} alt={p.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <ShoppingCart className="w-8 h-8 text-muted-foreground/20" strokeWidth={1} />
                          )}
                        </div>
                        <Link to={`/product/${p.id}`} className="text-sm font-semibold hover:text-primary line-clamp-2">{p.name}</Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-3 text-sm font-semibold text-muted-foreground">Price</td>
                  {compareProducts.map((p) => (
                    <td key={p.id} className="p-3 text-center">
                      <span className="text-lg font-extrabold text-primary">{formatPrice(p.discounted_price ?? p.price)}</span>
                      {p.original_price && p.original_price > ((p.discounted_price ?? p.price) ?? 0) && (
                        <span className="block text-xs line-through text-muted-foreground">{formatPrice(p.original_price)}</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border bg-muted/20">
                  <td className="p-3 text-sm font-semibold text-muted-foreground">Rating</td>
                  {compareProducts.map((p) => (
                    <td key={p.id} className="p-3 text-center text-sm font-medium">⭐ {p.rating}</td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3 text-sm font-semibold text-muted-foreground">Category</td>
                  {compareProducts.map((p) => (
                    <td key={p.id} className="p-3 text-center text-sm">{CATEGORIES.find((c) => c.slug === p.category)?.label ?? p.category}</td>
                  ))}
                </tr>
                <tr className="border-b border-border bg-muted/20">
                  <td className="p-3 text-sm font-semibold text-muted-foreground">Brand</td>
                  {compareProducts.map((p) => (
                    <td key={p.id} className="p-3 text-center text-sm">{p.brand ?? "—"}</td>
                  ))}
                </tr>
                {allSpecKeys.map((key, i) => (
                  <tr key={key} className={`border-b border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="p-3 text-sm font-semibold text-muted-foreground capitalize whitespace-nowrap">{key.replace(/_/g, " ")}</td>
                    {compareProducts.map((p) => {
                      const val = p.specs?.[key];
                      return (
                        <td key={p.id} className="p-3 text-center text-sm">
                          {val === undefined || val === null ? "—" : Array.isArray(val) ? val.join(", ") : typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td className="p-3"></td>
                  {compareProducts.map((p) => (
                    <td key={p.id} className="p-3 text-center">
                      <Button size="sm" className="gap-1.5" onClick={() => handleAddToCart(p)}>
                        <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};

export default Compare;
