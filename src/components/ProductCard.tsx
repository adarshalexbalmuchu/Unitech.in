import { memo, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, Zap, TrendingUp } from "lucide-react";
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
        className={`group cursor-pointer flex flex-col ${
          compact ? "w-[148px] sm:w-[184px] min-w-[148px] flex-shrink-0 snap-start" : ""
        }`}
      >
        {/* ── Image block ── */}
        <div className="relative w-full aspect-square bg-[#F5F5F5] overflow-hidden">
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-contain p-5 md:p-6 transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              if (e.currentTarget.src !== fallbackImage) e.currentTarget.src = fallbackImage;
            }}
          />

          {/* Discount badge — top left */}
          {discount > 0 && (
            <span className="absolute top-3 left-3 text-[10px] font-bold text-primary">
              -{discount}%
            </span>
          )}

          {/* Collection pill — top left (below discount) */}
          {(isFlashSale || isNewArrival || isHotSelling) && (
            <span className="absolute top-3 left-3 mt-[18px] text-[10px] font-semibold text-muted-foreground">
              {isFlashSale ? (
                <><Zap className="inline w-2.5 h-2.5 mb-0.5" /> Flash Sale</>
              ) : isNewArrival ? "Just In" : "Best Seller"}
            </span>
          )}

          {/* Wishlist — top right */}
          <button
            onClick={handleWishlist}
            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center transition-transform duration-150 hover:scale-110"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                wishlisted ? "fill-primary text-primary" : "text-foreground/30 group-hover:text-foreground/60"
              }`}
              strokeWidth={1.75}
            />
          </button>
        </div>

        {/* ── Info ── */}
        <div className={`flex flex-col ${compact ? "pt-2.5" : "pt-3"}`}>
          {/* Name */}
          <h3 className={`font-semibold text-foreground leading-snug line-clamp-2 ${
            compact ? "text-[11px]" : "text-[13.5px] md:text-[14px]"
          }`}>
            {product.name}
          </h3>

          {/* Category + rating row */}
          {!compact && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-[12px] text-muted-foreground">{categoryLabel}</span>
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                {product.rating}
                <span className="ml-0.5">({product.reviews_count})</span>
              </span>
            </div>
          )}

          {/* Low stock */}
          {lowStock && !compact && (
            <span className="text-[11px] font-semibold text-primary mt-0.5">
              Only {product.stock} left
            </span>
          )}

          {/* Price row */}
          <div className={`flex items-center justify-between ${compact ? "mt-1.5" : "mt-3"}`}>
            <div className="flex items-baseline gap-1.5 tabular-nums">
              <span className={`font-bold text-foreground ${compact ? "text-sm" : "text-[14px] md:text-[15px]"}`}>
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > (product.price ?? 0) && (
                <span className="text-[11px] line-through text-muted-foreground">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>

            {/* Add to cart — Nike-style text link */}
            {!compact && (
              <button
                onClick={handleAddToCart}
                className="text-[12px] font-semibold text-foreground underline underline-offset-2 decoration-foreground/30 hover:decoration-primary hover:text-primary transition-colors"
              >
                Add to cart
              </button>
            )}
          </div>
        </div>
      </article>
    );
  })
);

ProductCard.displayName = "ProductCard";
export default ProductCard;
