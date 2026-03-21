import { memo, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, ShoppingCart, Zap, TrendingUp } from "lucide-react";
import type { Product } from "@/hooks/useProducts";
import {
  formatPrice,
  getDiscountPercent,
  CATEGORIES,
  getCategoryFallbackImage,
  resolvePrimaryProductImage,
} from "@/lib/constants";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

const ProductCard = memo(
  forwardRef<HTMLElement, ProductCardProps>(({ product, compact = false }, ref) => {
    const navigate = useNavigate();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { addToCart } = useCart();

    const discount = getDiscountPercent(product.price, product.original_price);
    const wishlisted = isInWishlist(product.id);
    const categoryLabel = CATEGORIES.find((c) => c.slug === product.category)?.label ?? product.category;
    const isFlashSale = product.collections.includes("flash-sale");
    const isHotSelling = product.collections.includes("hot-selling");
    const isNewArrival = product.collections.includes("new-arrivals");
    const lowStock = product.stock > 0 && product.stock <= 10;
    const fallbackImage = getCategoryFallbackImage(product.category);
    const productImage = resolvePrimaryProductImage(product.image_url, product.category);

    const handleNavigate = () => navigate(`/product/${product.slug}`);

    const handleWishlist = (e: React.MouseEvent) => {
      e.stopPropagation();
      const wasWishlisted = wishlisted;
      toggleWishlist(product.id, {
        name: product.name,
        price: product.price,
        original_price: product.original_price,
        image_url: product.image_url,
      });
      toast(wasWishlisted ? "Removed from wishlist" : "Added to wishlist", { description: product.name });
    };

    const handleAddToCart = (e: React.MouseEvent) => {
      e.stopPropagation();
      addToCart(product.id, { name: product.name, price: product.price ?? 0, image_url: product.image_url });
      toast.success("Added to cart", { description: product.name });
    };

    /* Badge logic: max 2 badges, discount is always primary */
    const badges: { label: string; bg: string; color: string; icon?: typeof Zap; secondary?: boolean }[] = [];
    if (discount > 0) badges.push({ label: `-${discount}%`, bg: "#e8251a", color: "#fff" });
    if (isFlashSale) badges.push({ label: "Flash", bg: "#e8a020", color: "#fff", icon: Zap });
    else if (isNewArrival && discount === 0) badges.push({ label: "New", bg: "#e8a020", color: "#1a1a1a" });
    else if (isHotSelling) badges.push({ label: "Hot", bg: "rgba(0,0,0,0.65)", color: "#fff", icon: TrendingUp, secondary: true });

    return (
      <article
        ref={ref as React.Ref<HTMLElement>}
        onClick={handleNavigate}
        className={`product-card group bg-white overflow-hidden cursor-pointer flex flex-col
          transition-all duration-200 ease-out
          ${compact ? "w-[148px] sm:w-[184px] min-w-[148px] flex-shrink-0 snap-start rounded-xl" : ""}`}
        style={compact ? undefined : {
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.07)",
        }}
        onMouseEnter={(e) => {
          if (!compact) {
            e.currentTarget.style.border = "1px solid rgba(232,37,26,0.2)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!compact) {
            e.currentTarget.style.border = "1px solid rgba(0,0,0,0.07)";
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        {/* ── Image ── */}
        <div
          className="relative w-full overflow-hidden"
          style={compact ? { aspectRatio: "1", background: "#f8f8f8" } : { height: 220, background: "#f8f8f8", borderRadius: "10px 10px 0 0" }}
        >
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              if (e.currentTarget.src !== fallbackImage) e.currentTarget.src = fallbackImage;
            }}
          />

          {/* ── Badges — max 2, discount always first ── */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {badges.slice(0, 2).map((b) => {
              const Icon = b.icon;
              return (
                <span
                  key={b.label}
                  className="rounded-full px-2 py-0.5 flex items-center gap-0.5"
                  style={{
                    background: b.bg,
                    color: b.color,
                    fontSize: b.secondary ? 10 : 11,
                    fontWeight: 700,
                  }}
                >
                  {Icon && <Icon className="w-2 h-2" />}
                  {b.label}
                </span>
              );
            })}
          </div>

          {/* ── Wishlist ── */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200
              ${wishlisted
                ? "bg-[#e8251a]"
                : "bg-white/80 backdrop-blur-sm hover:bg-white"
              }`}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`w-3 h-3 ${wishlisted ? "fill-white text-white" : "text-black/40"}`}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* ── Info ── */}
        <div className={compact ? "p-2.5 flex flex-col flex-1" : "flex flex-col flex-1"} style={compact ? undefined : { padding: "14px 16px 0" }}>
          {/* Category */}
          {!compact && (
            <span
              className="mb-1"
              style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(0,0,0,0.35)" }}
            >
              {categoryLabel}
            </span>
          )}

          {/* Name */}
          <h3
            className="line-clamp-2"
            style={{
              fontSize: compact ? 11 : 14,
              fontWeight: 600,
              color: "#111",
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.7)" }}>{product.rating}</span>
            <span style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>({product.reviews_count})</span>
            {lowStock && (
              <span className="ml-auto shrink-0" style={{ fontSize: 9, fontWeight: 700, color: "#e8251a" }}>{product.stock} left</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 mt-2 tabular-nums">
            <span style={{ fontSize: compact ? 14 : 16, fontWeight: 700, color: "#111" }}>
              {formatPrice(product.price)}
            </span>
            {product.original_price && product.original_price > (product.price ?? 0) && (
              <span style={{ fontSize: 12, textDecoration: "line-through", color: "rgba(0,0,0,0.35)" }}>
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>
          {!compact && (
            <span style={{ fontSize: 9, color: "rgba(0,0,0,0.3)", marginTop: 2 }}>Excl. of taxes</span>
          )}
          {!compact && (
            <p style={{ fontSize: 8, color: "rgba(0,0,0,0.28)", marginTop: 8, lineHeight: 1.4 }}>
              *Product images are indicative and may differ from the actual product.
            </p>
          )}
        </div>

        {/* ── Add to Cart — flush at bottom ── */}
        {!compact && (
          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center gap-1.5 mt-auto transition-colors duration-200"
            style={{
              background: "#111",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              padding: "10px 0",
              borderRadius: "0 0 10px 10px",
              marginTop: 14,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e8251a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#111")}
          >
            <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />
            Add to Cart
          </button>
        )}
      </article>
    );
  })
);

ProductCard.displayName = "ProductCard";
export default ProductCard;
