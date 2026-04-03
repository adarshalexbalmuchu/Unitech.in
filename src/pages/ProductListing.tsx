import { useState, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ChevronRight, SlidersHorizontal, ArrowUpDown, X, Search } from "lucide-react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { CATEGORIES } from "@/lib/constants";

type SortKey = "price-asc" | "price-desc" | "rating" | "newest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "rating", label: "Top Rated" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest First" },
];

const PRICE_RANGES = [
  { label: "Under ₹1,000", min: 0, max: 999 },
  { label: "₹1,000 – ₹5,000", min: 1000, max: 5000 },
  { label: "₹5,000 – ₹15,000", min: 5000, max: 15000 },
  { label: "₹15,000 – ₹30,000", min: 15000, max: 30000 },
  { label: "Above ₹30,000", min: 30000, max: Infinity },
];

const ProductListing = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useProducts(category === "all" ? undefined : category);

  const [sort, setSort] = useState<SortKey>("rating");
  const [priceRange, setPriceRange] = useState<number | null>(null);
  const [showFeatured, setShowFeatured] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [inlineSearch, setInlineSearch] = useState(searchQuery);

  const catMeta = CATEGORIES.find((c) => c.slug === category);
  const catLabel = searchQuery ? `Search: "${searchQuery}"` : (catMeta?.label ?? "All Products");
  const CatIcon = searchQuery ? undefined : catMeta?.icon;

  const filtered = useMemo(() => {
    let items = [...products];
    // Search query filter
    if (searchQuery.trim().length >= 2) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.model_number?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    if (showFeatured) items = items.filter((p) => p.is_featured || p.collections.includes("hot-selling"));
    if (priceRange !== null) {
      const range = PRICE_RANGES[priceRange];
      items = items.filter((p) => p.price !== null && p.price >= range.min && p.price <= range.max);
    }
    items.sort((a, b) => {
      switch (sort) {
        case "price-asc": return (a.price ?? 0) - (b.price ?? 0);
        case "price-desc": return (b.price ?? 0) - (a.price ?? 0);
        case "rating": return b.rating - a.rating;
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return 0;
      }
    });
    return items;
  }, [products, sort, priceRange, showFeatured, searchQuery]);

  const activeFilterCount = (priceRange !== null ? 1 : 0) + (showFeatured ? 1 : 0);

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error && err.message) return err.message;
    return "Unable to load products.";
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Price Range</h3>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((range, i) => (
            <button
              key={i}
              onClick={() => setPriceRange(priceRange === i ? null : i)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                priceRange === i ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-foreground"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Quick Filters</h3>
        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md hover:bg-muted transition-colors">
          <input
            type="checkbox"
            checked={showFeatured}
            onChange={(e) => setShowFeatured(e.target.checked)}
            className="rounded border-border accent-primary"
          />
          <span className="text-sm">Featured & Hot Selling</span>
        </label>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Categories</h3>
        <div className="space-y-0.5">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isActive = c.slug === category;
            return (
              <Link
                key={c.slug}
                to={`/products/${c.slug}`}
                onClick={() => setMobileFiltersOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                {c.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StickyHeader />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-12 md:pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] md:text-xs text-muted-foreground mb-4 md:mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products/all" className="hover:text-foreground transition-colors">Products</Link>
          {category && category !== "all" && !searchQuery && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">{catMeta?.label ?? category}</span>
            </>
          )}
          {searchQuery && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">Search</span>
            </>
          )}
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            {CatIcon && <CatIcon className="w-6 h-6 md:w-7 md:h-7 text-primary" strokeWidth={1.5} />}
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold">{catLabel}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                {isLoading ? "Loading…" : `${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          {/* Inline search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = inlineSearch.trim();
              if (trimmed.length >= 2) {
                setSearchParams(trimmed ? { q: trimmed } : {});
              } else {
                setSearchParams({});
              }
            }}
            className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto"
          >
            <div className="flex items-center gap-2 flex-1 sm:w-64 px-3 py-2 rounded-lg bg-muted border border-transparent focus-within:border-border transition-colors">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                value={inlineSearch}
                onChange={(e) => setInlineSearch(e.target.value)}
                placeholder="Search products…"
                className="flex-1 bg-transparent outline-none text-sm"
              />
              {inlineSearch && (
                <button
                  type="button"
                  onClick={() => { setInlineSearch(""); setSearchParams({}); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 flex-wrap">
          {/* Desktop filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-muted"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-primary-foreground text-primary text-[0.6rem] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Mobile filter button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className={`lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              activeFilterCount > 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-muted"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-primary-foreground text-primary text-[0.6rem] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="text-xs md:text-sm bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar filters */}
          {showFilters && (
            <aside className="w-56 flex-shrink-0 hidden lg:block">
              <FilterContent />
            </aside>
          )}

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Active filter pills */}
            {activeFilterCount > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {priceRange !== null && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {PRICE_RANGES[priceRange].label}
                    <button onClick={() => setPriceRange(null)}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {showFeatured && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    Featured
                    <button onClick={() => setShowFeatured(false)}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-lg p-3 animate-pulse">
                    <div className="aspect-square bg-muted rounded-md mb-3" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-16 md:py-20 space-y-3">
                <p className="text-lg font-semibold text-destructive">Could not load products</p>
                <p className="text-sm text-muted-foreground">{getErrorMessage(error)}</p>
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 md:py-20">
                <p className="text-lg font-semibold text-muted-foreground mb-2">No products found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or{" "}
                  <Link to="/products/all" className="text-primary hover:underline">browse all products</Link>
                </p>
              </div>
            ) : (
              <div className={`grid gap-3 md:gap-6 ${
                showFilters
                  ? "grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}>
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-background shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg">Filters</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterContent />
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
};

export default ProductListing;
