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

    return (
      <article
        ref={ref as React.Ref<HTMLElement>}
        onClick={handleNavigate}
        className={`group bg-white rounded-2xl overflow-hidden cursor-pointer flex flex-col
          shadow-[0_2px_8px_rgba(0,0,0,0.07)]
          hover:shadow-[0_16px_40px_rgba(0,0,0,0.13)]
          hover:-translate-y-1
          transition-all duration-300 ease-out
          ${compact ? "w-[148px] sm:w-[184px] min-w-[148px] flex-shrink-0 snap-start" : ""}`}
      >
        {/* ── Image ── */}
        <div className="relative w-full aspect-square bg-[#F5F5F5] overflow-hidden">
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

          {/* ── Badges ── */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {discount > 0 && (
              <span className="rounded-full bg-primary text-white text-[9px] font-bold px-2 py-0.5">
                -{discount}%
              </span>
            )}
            {isFlashSale && (
              <span className="rounded-full bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 flex items-center gap-0.5">
                <Zap className="w-2 h-2" /> Flash
              </span>
            )}
            {isNewArrival && !isFlashSale && (
              <span className="rounded-full bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5">
                New
              </span>
            )}
            {isHotSelling && !isFlashSale && !isNewArrival && (
              <span className="rounded-full bg-[#111] text-white text-[9px] font-bold px-2 py-0.5 flex items-center gap-0.5">
                <TrendingUp className="w-2 h-2" /> Hot
              </span>
            )}
          </div>

          {/* ── Wishlist — always visible, subtle ── */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200
              ${wishlisted
                ? "bg-primary shadow-sm"
                : "bg-white/70 backdrop-blur-sm shadow-sm hover:bg-white"
              }`}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`w-3 h-3 ${wishlisted ? "fill-white text-white" : "text-foreground/50"}`}
              strokeWidth={2}
            />
          </button>

          {/* ── Add to cart slide-up ── */}
          {!compact && (
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out z-10">
              <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-[#111] text-white text-[11px] font-bold tracking-wide flex items-center justify-center gap-1.5 hover:bg-primary transition-colors duration-150"
              >
                <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />
                Add to Cart
              </button>
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className={`flex flex-col ${compact ? "p-2.5" : "p-3 md:p-3.5"}`}>
          {/* Category */}
          {!compact && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
              {categoryLabel}
            </span>
          )}

          {/* Name */}
          <h3 className={`font-semibold leading-snug line-clamp-2 text-foreground/90 ${compact ? "text-[11px]" : "text-[12.5px] sm:text-[13px]"}`}>
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
            <span className="text-[11px] font-semibold text-foreground/80">{product.rating}</span>
            <span className="text-[11px] text-muted-foreground">({product.reviews_count})</span>
            {lowStock && (
              <span className="ml-auto text-[9px] font-bold text-primary shrink-0">{product.stock} left</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 mt-2 tabular-nums">
            <span className={`font-extrabold text-foreground ${compact ? "text-sm" : "text-base sm:text-[17px]"}`}>
              {formatPrice(product.price)}
            </span>
            {product.original_price && product.original_price > (product.price ?? 0) && (
              <span className="text-[11px] line-through text-muted-foreground">
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
