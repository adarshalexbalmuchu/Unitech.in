import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Wishlist = () => {
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleRemove = (item: typeof wishlistItems[0]) => {
    toggleWishlist(item.product_id);
    toast("Removed from wishlist", { description: item.product.name });
  };

  const handleAddToCart = (item: typeof wishlistItems[0]) => {
    addToCart(item.product_id, {
      name: item.product.name,
      price: item.product.price ?? 0,
      image_url: item.product.image_url,
    });
    toast.success("Added to cart", { description: item.product.name });
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StickyHeader />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-12 md:pb-16">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-6 h-6 text-primary" />
          <h1 className="text-xl md:text-2xl font-extrabold">My Wishlist</h1>
          <span className="text-sm text-muted-foreground">({wishlistItems.length} items)</span>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" strokeWidth={1} />
            <p className="text-lg font-semibold text-muted-foreground mb-2">Your wishlist is empty</p>
            <p className="text-sm text-muted-foreground mb-6">Browse products and tap the heart icon to save them here</p>
            <Button asChild><Link to="/products/all">Browse Products</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-card rounded-lg border border-border p-3 flex flex-col gap-3">
                <Link to={`/products/all`} className="aspect-square bg-surface rounded-md overflow-hidden flex items-center justify-center">
                  {item.product.image_url && !item.product.image_url.includes("placeholder") ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <ShoppingCart className="w-10 h-10 text-muted-foreground/20" strokeWidth={1} />
                  )}
                </Link>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold line-clamp-2">{item.product.name}</h3>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-base font-extrabold text-primary">₹{(item.product.price ?? 0).toLocaleString("en-IN")}</span>
                    {item.product.original_price && item.product.original_price > (item.product.price ?? 0) && (
                      <span className="text-xs line-through text-muted-foreground">₹{item.product.original_price.toLocaleString("en-IN")}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 gap-1.5" onClick={() => handleAddToCart(item)}>
                    <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRemove(item)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};

export default Wishlist;
