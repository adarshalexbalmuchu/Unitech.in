import { memo, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, ShoppingCart, Zap, TrendingUp } from "lucide-react";
import type { Product } from "@/hooks/useProducts";
import { formatPrice, getDiscountPercent, CATEGORIES } from "@/lib/constants";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";

interface ProductCardProps {
  product: Product;
  /** Compact mode for horizontal scroll rows (flash sale, etc.) */
  compact?: boolean;
}

const ProductCard = memo(({ product, compact = false }: ProductCardProps) => {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const discount = getDiscountPercent(product.price, product.original_price);
  const wishlisted = isInWishlist(product.id);
  const categoryLabel = CATEGORIES.find((c) => c.slug === product.category)?.label ?? product.category;
  const isFlashSale = product.collections.includes("flash-sale");
  const isHotSelling = product.collections.includes("hot-selling");
  const lowStock = product.stock > 0 && product.stock <= 10;

  const handleNavigate = () => navigate(`/product/${product.slug}`);

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id, {
      name: product.name,
      price: product.price,
      original_price: product.original_price,
      image_url: product.image_url,
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product.id, {
      name: product.name,
      price: product.price ?? 0,
      image_url: product.image_url,
    });
  };

  // Build a short spec line from the specs object
  const specSummary = buildSpecSummary(product);

  return (
    <article
      onClick={handleNavigate}
      className={`group bg-card rounded-lg flex flex-col relative cursor-pointer outline outline-1 outline-border -outline-offset-1 hover:outline-primary/30 transition-all duration-300 hover:shadow-[var(--vm-shadow-hover)] ${
        compact ? "w-[200px] md:w-[220px] min-w-[200px] flex-shrink-0 snap-start p-3 gap-2.5" : "p-3 gap-3"
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
        {isHotSelling && !isFlashSale && (
          <span className="bg-primary text-primary-foreground text-[0.6rem] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <TrendingUp className="w-2.5 h-2.5" /> HOT
          </span>
        )}
      </div>

      {/* ── Wishlist button ── */}
      <button
        onClick={handleWishlist}
        className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm w-8 h-8 rounded-full flex justify-center items-center shadow-sm transition-all hover:scale-110"
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${wishlisted ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
          strokeWidth={1.5}
        />
      </button>

      {/* ── Image ── */}
      <div className="w-full aspect-square bg-surface rounded-md overflow-hidden flex justify-center items-center">
        {product.image_url && product.image_url !== "/placeholder.svg" ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/30">
            <ShoppingCart className="w-8 h-8" strokeWidth={1} />
            <span className="text-[0.6rem] font-medium uppercase tracking-wider">
              {categoryLabel}
            </span>
          </div>
        )}
      </div>

      {/* ── Category tag ── */}
      {!compact && (
        <span className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-wider">
          {categoryLabel}
        </span>
      )}

      {/* ── Name ── */}
      <h3 className={`font-semibold leading-snug line-clamp-2 ${compact ? "text-xs" : "text-sm"}`}>
        {product.name}
      </h3>

      {/* ── Spec summary ── */}
      {specSummary && !compact && (
        <p className="text-[0.7rem] text-muted-foreground line-clamp-1">{specSummary}</p>
      )}

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
        <span className={`font-extrabold text-primary ${compact ? "text-base" : "text-lg"}`}>
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
          className="w-full py-2 rounded-md text-xs font-semibold bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200 flex items-center justify-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Add to Cart
        </button>
      )}
    </article>
  );
});

ProductCard.displayName = "ProductCard";

/** Build a short spec line from the product's specs object */
function buildSpecSummary(product: Product): string {
  const s = product.specs;
  if (!s || Object.keys(s).length === 0) return "";

  const parts: string[] = [];

  // Wattage / power
  if (s.wattage) parts.push(`${s.wattage}W`);
  if (s.output_power && typeof s.output_power === "string") parts.push(s.output_power);

  // Channels
  if (s.channels) parts.push(`${s.channels}ch`);

  // Connectivity shorthand
  if (s.bluetooth === true || (Array.isArray(s.connectivity) && s.connectivity.some((c) => String(c).toLowerCase().includes("bluetooth")))) {
    parts.push("BT");
  }

  // Screen / size
  if (s.screen_size) parts.push(String(s.screen_size));
  if (s.screen_range) parts.push(String(s.screen_range));
  if (s.driver_size) parts.push(String(s.driver_size));
  if (s.bass_driver) parts.push(`${s.bass_driver} bass`);

  // Type for non-audio
  if (s.mount_type) parts.push(String(s.mount_type));
  if (s.type && typeof s.type === "string") parts.push(s.type);
  if (s.kit_type && typeof s.kit_type === "string") parts.push(s.kit_type);

  // Sockets
  if (s.sockets) parts.push(`${s.sockets} sockets`);

  return parts.slice(0, 4).join(" · ");
}

export default ProductCard;
