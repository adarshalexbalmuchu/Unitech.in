import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, Minus, Plus } from "lucide-react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import { useProducts, type Product } from "@/hooks/useProducts";
import { formatPrice, getDiscountPercent, CATEGORIES, isPlaceholderImage } from "@/lib/constants";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: allProducts = [], isLoading } = useProducts();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const product = useMemo(() => allProducts.find((p) => p.slug === slug), [allProducts, slug]);

  const related = useMemo(() => {
    if (!product) return [];
    return allProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  }, [allProducts, product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <StickyHeader />
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 animate-pulse">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <StickyHeader />
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Link to="/products/all" className="text-primary font-semibold hover:underline">Browse All Products</Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const discount = getDiscountPercent(product.price, product.original_price);
  const catMeta = CATEGORIES.find((c) => c.slug === product.category);
  const catLabel = catMeta?.label ?? product.category;
  const wishlisted = isInWishlist(product.id);
  const inStock = product.stock > 0;
  const images = [product.image_url, ...(product.images || [])].filter(Boolean);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addToCart(product.id, { name: product.name, price: product.price ?? 0, image_url: product.image_url });
    }
    toast.success(`Added ${qty} item${qty > 1 ? "s" : ""} to cart`, { description: product.name });
  };

  const handleWishlist = () => {
    const wasWishlisted = wishlisted;
    toggleWishlist(product.id, {
      name: product.name,
      price: product.price,
      original_price: product.original_price,
      image_url: product.image_url,
    });
    toast(wasWishlisted ? "Removed from wishlist" : "Added to wishlist", { description: product.name });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const specEntries = Object.entries(product.specs || {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StickyHeader />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-12 md:pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] md:text-xs text-muted-foreground mb-4 md:mb-6 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products/all" className="hover:text-foreground transition-colors">Products</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/products/${product.category}`} className="hover:text-foreground transition-colors">{catLabel}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Left — Image gallery */}
          <div className="space-y-3">
            <div className="aspect-square bg-surface rounded-lg overflow-hidden flex items-center justify-center relative">
              {discount > 0 && (
                <span className="absolute top-3 left-3 md:top-4 md:left-4 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded z-10">
                  -{discount}%
                </span>
              )}
              {!isPlaceholderImage(images[activeImg]) ? (
                <img src={images[activeImg]} alt={product.name} className="w-full h-full object-contain p-4 md:p-6" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                  <ShoppingCart className="w-12 h-12 md:w-16 md:h-16" strokeWidth={0.8} />
                  <span className="text-xs font-medium uppercase tracking-wider">{catLabel}</span>
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-md overflow-hidden border-2 flex-shrink-0 transition-colors ${
                      i === activeImg ? "border-primary" : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Product info */}
          <div className="space-y-4 md:space-y-5">
            {/* Category + Brand */}
            <div className="flex items-center gap-2">
              <Link
                to={`/products/${product.category}`}
                className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
              >
                {catLabel}
              </Link>
              {product.brand && (
                <span className="text-xs font-medium text-muted-foreground">{product.brand}</span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight">{product.name}</h1>

            {/* Model */}
            {product.model_number && (
              <p className="text-xs md:text-sm text-muted-foreground">
                Model: <span className="font-medium text-foreground">{product.model_number}</span>
                {product.sku && <span className="ml-3">SKU: {product.sku}</span>}
              </p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 ${i < Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-border"}`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold">{product.rating}</span>
              <span className="text-xs md:text-sm text-muted-foreground">({product.reviews_count} reviews)</span>
            </div>

            {/* Price block */}
            <div className="bg-surface rounded-lg p-3 md:p-4 space-y-1">
              <div className="flex items-baseline gap-2 md:gap-3 flex-wrap">
                <span className="text-2xl md:text-3xl font-extrabold text-primary tabular-nums">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.original_price > (product.price ?? 0) && (
                  <span className="text-base md:text-lg line-through text-muted-foreground tabular-nums">
                    {formatPrice(product.original_price)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-xs md:text-sm font-bold text-destructive">Save {discount}%</span>
                )}
              </div>
              <p className="text-[11px] md:text-xs text-muted-foreground">Inclusive of all taxes. Shipping calculated at checkout.</p>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-destructive"}`} />
              <span className={`text-sm font-medium ${inStock ? "text-green-600" : "text-destructive"}`}>
                {inStock ? (product.stock <= 10 ? `Only ${product.stock} left in stock` : "In Stock") : "Out of Stock"}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* Quantity + CTA — stacked on mobile */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <div className="flex items-center border border-border rounded-lg self-start">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2.5 hover:bg-muted transition-colors"
                  disabled={qty <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2.5 text-sm font-semibold tabular-nums min-w-[40px] text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="px-3 py-2.5 hover:bg-muted transition-colors"
                  disabled={qty >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>

              <div className="flex gap-2 self-start sm:self-auto">
                <button
                  onClick={handleWishlist}
                  className={`p-3 rounded-lg border transition-colors ${
                    wishlisted ? "bg-destructive/10 border-destructive/30 text-destructive" : "border-border hover:bg-muted"
                  }`}
                  aria-label="Toggle wishlist"
                >
                  <Heart className={`w-5 h-5 ${wishlisted ? "fill-current" : ""}`} />
                </button>

                <button onClick={handleShare} className="p-3 rounded-lg border border-border hover:bg-muted transition-colors" aria-label="Share">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 pt-4 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[11px] md:text-xs text-muted-foreground text-center sm:text-left">
                <Truck className="w-4 h-4 text-primary shrink-0" />
                <span>Free Shipping</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[11px] md:text-xs text-muted-foreground text-center sm:text-left">
                <Shield className="w-4 h-4 text-primary shrink-0" />
                <span>1 Year Warranty</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[11px] md:text-xs text-muted-foreground text-center sm:text-left">
                <RotateCcw className="w-4 h-4 text-primary shrink-0" />
                <span>7-Day Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specs table */}
        {specEntries.length > 0 && (
          <section className="mt-10 md:mt-14">
            <h2 className="text-lg md:text-xl font-extrabold mb-4 md:mb-6">Specifications</h2>
            <div className="bg-card rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <tbody>
                  {specEntries.map(([key, value], i) => (
                    <tr key={key} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="px-4 md:px-5 py-2.5 md:py-3 font-semibold text-muted-foreground capitalize whitespace-nowrap w-36 md:w-48 text-xs md:text-sm">
                        {key.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm">
                        {Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-10 md:mt-14">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-extrabold">Related Products</h2>
              <Link
                to={`/products/${product.category}`}
                className="text-sm text-primary font-semibold hover:underline"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};

export default ProductDetail;
