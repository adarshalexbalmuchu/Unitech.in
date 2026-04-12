import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, ShoppingCart } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { formatPrice, CATEGORIES } from "@/lib/constants";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const { data: products = [] } = useProducts();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return products
      .filter((p) => {
        // Direct field matches
        if (p.name.toLowerCase().includes(q)) return true;
        if (p.category.toLowerCase().includes(q)) return true;
        if (p.brand?.toLowerCase().includes(q)) return true;
        if (p.model_number?.toLowerCase().includes(q)) return true;
        if (p.description?.toLowerCase().includes(q)) return true;
        // Meta / rich content matches
        if (p.seo_meta_description?.toLowerCase().includes(q)) return true;
        if (p.short_tagline?.toLowerCase().includes(q)) return true;
        if (p.highlights?.some((h) => h.toLowerCase().includes(q))) return true;
        if (p.perfect_for?.some((t) => t.toLowerCase().includes(q))) return true;
        if (p.sku?.toLowerCase().includes(q)) return true;
        // Specs values (e.g. "bluetooth", "100W")
        if (p.specs && Object.values(p.specs).some((v) =>
          String(v).toLowerCase().includes(q)
        )) return true;
        // Collections / tags
        if (p.collections?.some((c) => c.toLowerCase().includes(q))) return true;
        return false;
      })
      .slice(0, 8);
  }, [query, products]);

  const categoryResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return CATEGORIES.filter((c) => c.label.toLowerCase().includes(q));
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (slug: string) => {
    onClose();
    navigate(`/product/${slug}`);
  };

  const handleCategorySelect = (slug: string) => {
    onClose();
    navigate(`/products/${slug}`);
  };

  const handleSearch = () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    onClose();
    navigate(`/products/all?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-0 left-0 right-0 z-50 bg-background shadow-lg">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 bg-muted rounded-lg px-4 py-3">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for speakers, amplifiers, home theatre..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          {query.length >= 2 && (
            <div className="mt-3 max-h-[60vh] overflow-y-auto">
              {/* Category matches */}
              {categoryResults.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categoryResults.map((c) => {
                      const Icon = c.icon;
                      return (
                        <button
                          key={c.slug}
                          onClick={() => handleCategorySelect(c.slug)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-sm font-medium transition-colors"
                        >
                          <Icon className="w-4 h-4" strokeWidth={1.5} />
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product results */}
              {results.length > 0 ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">Products</p>
                  <div className="space-y-1">
                    {results.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelect(p.slug)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <div className="w-12 h-12 rounded-md bg-surface overflow-hidden flex items-center justify-center shrink-0">
                          {p.image_url && p.image_url !== "/placeholder.svg" ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <ShoppingCart className="w-5 h-5 text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {CATEGORIES.find((c) => c.slug === p.category)?.label ?? p.category}
                            {p.model_number && ` · ${p.model_number}`}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-primary shrink-0">{formatPrice(p.discounted_price ?? p.price)}</span>
                      </button>
                    ))}
                  </div>
                  {/* View all results link */}
                  <button
                    onClick={handleSearch}
                    className="w-full mt-2 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    View all results for "{query}"
                  </button>
                </div>
              ) : (
                categoryResults.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No results for "{query}"
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchModal;
