import { memo, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, ShoppingCart, Zap, TrendingUp } from "lucide-react";
import type { Product } from "@/hooks/useProducts";
import { formatPrice, getDiscountPercent, CATEGORIES, getCategoryFallbackImage, resolvePrimaryProductImage } from "@/lib/constants";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  /** Compact mode for horizontal scroll rows (flash sale, etc.) */
  compact?: boolean;
}

const ProductCard = memo(forwardRef<HTMLElement, ProductCardProps>(({ product, compact = false }, ref) => {
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
    toast.success("Added to cart", {
      description: product.name,
    });
  };

  return (
    <article
      onClick={handleNavigate}
      className={`group bg-card rounded-lg flex flex-col relative cursor-pointer outline outline-1 outline-border -outline-offset-1 hover:outline-primary/30 transition-all duration-300 hover:shadow-[var(--vm-shadow-hover)] ${
        compact ? "w-[160px] sm:w-[200px] md:w-[220px] min-w-[160px] flex-shrink-0 snap-start p-2.5 sm:p-3 gap-2" : "p-2.5 sm:p-3 gap-2 sm:gap-3"
      }`}
    >
      {/* ── Badges ── */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
        {discount > 0 && (
          <span className="bg-destructive text-destructive-foreground text-[0.6rem] font-bold px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        )}
        {isFlashSale && (
          <span className="bg-amber-500 text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" /> FLASH
          </span>
        )}
        {isNewArrival && !isFlashSale && (
          <span className="bg-emerald-600 text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded">
            NEW
          </span>
        )}
        {isHotSelling && !isFlashSale && !isNewArrival && (
          <span className="bg-primary text-primary-foreground text-[0.6rem] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <TrendingUp className="w-2.5 h-2.5" /> HOT
          </span>
        )}
      </div>

      {/* ── Wishlist button ── */}
      <button
        onClick={handleWishlist}
        className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-sm w-9 h-9 rounded-full flex justify-center items-center shadow-sm transition-all hover:scale-110"
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${wishlisted ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
          strokeWidth={1.5}
        />
      </button>

      {/* ── Image ── */}
      <div className="w-full aspect-square bg-surface rounded-md overflow-hidden flex justify-center items-center">
        <img
          src={productImage}
          alt={product.name}
          className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onError={(event) => {
            if (event.currentTarget.src !== fallbackImage) {
              event.currentTarget.src = fallbackImage;
            }
          }}
        />
      </div>

      {/* ── Category tag ── */}
      {!compact && (
        <span className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-wider">
          {categoryLabel}
        </span>
      )}

      {/* ── Name ── */}
      <h3 className={`font-semibold leading-snug line-clamp-2 ${compact ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm"}`}>
        {product.name}
      </h3>

      {/* ── Rating ── */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
        <span className="font-semibold text-foreground">{product.rating}</span>
        <span>({product.reviews_count})</span>
        {lowStock && (
          <span className="ml-auto text-[0.6rem] font-bold text-destructive">
            Only {product.stock} left
          </span>
        )}
      </div>

      {/* ── Pricing ── */}
      <div className="flex items-baseline gap-2 tabular-nums mt-auto">
        <span className={`font-extrabold text-primary ${compact ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}>
          {formatPrice(product.price)}
        </span>
        {product.original_price && product.original_price > (product.price ?? 0) && (
          <span className="text-xs line-through text-muted-foreground">
            {formatPrice(product.original_price)}
          </span>
        )}
      </div>

      {/* ── Quick add to cart (non-compact only) ── */}
      {!compact && (
        <button
          onClick={handleAddToCart}
          className="w-full min-h-10 py-2 rounded-md text-xs font-semibold bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200 flex items-center justify-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Add to Cart
        </button>
      )}
    </article>
  );
}));

ProductCard.displayName = "ProductCard";


export default ProductCard;
