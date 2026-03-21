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
  /** Compact mode for horizontal scroll rows (flash sale, etc.) */
  compact?: boolean;
}

const ProductCard = memo(
  forwardRef<HTMLElement, ProductCardProps>(({ product, compact = false }, ref) => {
    const navigate = useNavigate();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { addToCart } = useCart();

    const discount = getDiscountPercent(product.price, product.original_price);
    const wishlisted = isInWishlist(product.id);
    const categoryLabel =
      CATEGORIES.find((c) => c.slug === product.category)?.label ?? product.category;
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
      toast(wasWishlisted ? "Removed from wishlist" : "Added to wishlist", {
        description: product.name,
      });
    };

    const handleAddToCart = (e: React.MouseEvent) => {
      e.stopPropagation();
      addToCart(product.id, {
        name: product.name,
        price: product.price ?? 0,
        image_url: product.image_url,
      });
      toast.success("Added to cart", { description: product.name });
    };

    return (
      <article
        ref={ref as React.Ref<HTMLElement>}
        onClick={handleNavigate}
        className={`group bg-white rounded-xl flex flex-col relative cursor-pointer transition-all duration-300 hover:shadow-[var(--vm-shadow-hover)] hover:-translate-y-0.5 ${
          compact
            ? "w-[152px] sm:w-[192px] md:w-[212px] min-w-[152px] flex-shrink-0 snap-start"
            : ""
        }`}
      >
        {/* ── Image container ── */}
        <div
          className={`relative w-full overflow-hidden bg-[#F5F5F5] ${
            compact ? "rounded-lg" : "rounded-xl"
          }`}
          style={{ aspectRatio: "1 / 1" }}
        >
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              if (e.currentTarget.src !== fallbackImage)
                e.currentTarget.src = fallbackImage;
            }}
          />

          {/* ── Badges ── */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {discount > 0 && (
              <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                -{discount}%
              </span>
            )}
            {isFlashSale && (
              <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                <Zap className="w-2 h-2" /> FLASH
              </span>
            )}
            {isNewArrival && !isFlashSale && (
              <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                NEW
              </span>
            )}
            {isHotSelling && !isFlashSale && !isNewArrival && (
              <span className="bg-foreground text-background text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                <TrendingUp className="w-2 h-2" /> HOT
              </span>
            )}
          </div>

          {/* ── Wishlist ── */}
          <button
            onClick={handleWishlist}
            className="absolute top-2.5 right-2.5 z-10 bg-white/90 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                wishlisted ? "fill-primary text-primary" : "text-foreground/60"
              }`}
              strokeWidth={1.75}
            />
          </button>

          {/* ── Add to cart — hover reveal (non-compact only) ── */}
          {!compact && (
            <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out z-10">
              <button
                onClick={handleAddToCart}
                className="w-full py-2.5 bg-foreground text-background text-[11px] font-bold tracking-wide flex items-center justify-center gap-1.5 hover:bg-primary transition-colors duration-150 rounded-b-xl"
              >
                <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />
                Add to Cart
              </button>
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className={compact ? "px-1 pt-2 pb-2" : "px-1 pt-3 pb-1"}>
          {/* Category */}
          {!compact && (
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 block">
              {categoryLabel}
            </span>
          )}

          {/* Name */}
          <h3
            className={`font-semibold leading-snug line-clamp-2 text-foreground ${
              compact ? "text-[11px]" : "text-xs sm:text-[13px]"
            }`}
          >
            {product.name}
          </h3>

          {/* Rating + low stock */}
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
            <span className="text-[11px] font-semibold text-foreground">{product.rating}</span>
            <span className="text-[11px] text-muted-foreground">({product.reviews_count})</span>
            {lowStock && (
              <span className="ml-auto text-[9px] font-bold text-primary shrink-0">
                {product.stock} left
              </span>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-1.5 mt-2 tabular-nums">
            <span
              className={`font-extrabold text-foreground ${
                compact ? "text-sm" : "text-base sm:text-lg"
              }`}
            >
              {formatPrice(product.price)}
            </span>
            {product.original_price &&
              product.original_price > (product.price ?? 0) && (
                <span className="text-xs line-through text-muted-foreground">
                  {formatPrice(product.original_price)}
                </span>
              )}
          </div>
        </div>
      </article>
    );
  })
);

ProductCard.displayName = "ProductCard";
export default ProductCard;
