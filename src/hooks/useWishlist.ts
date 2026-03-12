import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistItem {
  id: string;
  product_id: string;
  product: {
    name: string;
    price: number | null;
    original_price: number | null;
    image_url: string;
  };
}

interface WishlistStore {
  wishlistItems: WishlistItem[];
  loading: boolean;
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string, product?: WishlistItem["product"]) => void;
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      wishlistItems: [],
      loading: false,
      get wishlistCount() {
        return get().wishlistItems.length;
      },

      isInWishlist: (productId) => {
        return get().wishlistItems.some((i) => i.product_id === productId);
      },

      toggleWishlist: (productId, product) => {
        const items = get().wishlistItems;
        if (items.some((i) => i.product_id === productId)) {
          set({ wishlistItems: items.filter((i) => i.product_id !== productId) });
        } else {
          set({
            wishlistItems: [
              ...items,
              {
                id: crypto.randomUUID(),
                product_id: productId,
                product: product || {
                  name: "Product",
                  price: 0,
                  original_price: 0,
                  image_url: "/placeholder.svg",
                },
              },
            ],
          });
        }
      },
    }),
    { name: "unitech-wishlist" }
  )
);
