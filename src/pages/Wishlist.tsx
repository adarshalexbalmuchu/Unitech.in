import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { useWishlist } from "@/hooks/useWishlist";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";

const Wishlist = () => {
  const { wishlistItems } = useWishlist();
  const { data: allProducts = [] } = useProducts();

  const wishlistProducts = allProducts.filter((p) =>
    wishlistItems.some((item) => item.product_id === p.id)
  );

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StickyHeader />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-12 md:pb-16">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-6 h-6 text-primary" />
          <h1 className="text-xl md:text-2xl font-extrabold">My Wishlist</h1>
          <span className="text-sm text-muted-foreground">({wishlistProducts.length} items)</span>
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" strokeWidth={1} />
            <p className="text-lg font-semibold text-muted-foreground mb-2">Your wishlist is empty</p>
            <p className="text-sm text-muted-foreground mb-6">Browse products and tap the heart icon to save them here</p>
            <Button asChild><Link to="/products/all">Browse Products</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {wishlistProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};

export default Wishlist;
