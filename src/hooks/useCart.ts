import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    image_url: string;
  };
}

interface CartStore {
  cartItems: CartItem[];
  loading: boolean;
  cartCount: number;
  cartTotal: number;
  addToCart: (productId: string, product?: { name: string; price: number; image_url: string }) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      cartItems: [],
      loading: false,
      get cartCount() {
        return get().cartItems.reduce((sum, item) => sum + item.quantity, 0);
      },
      get cartTotal() {
        return get().cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      },

      addToCart: (productId, product) => {
        const items = get().cartItems;
        const existing = items.find((i) => i.product_id === productId);
        if (existing) {
          set({
            cartItems: items.map((i) =>
              i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            cartItems: [
              ...items,
              {
                id: crypto.randomUUID(),
                product_id: productId,
                quantity: 1,
                product: product || { name: "Product", price: 0, image_url: `${import.meta.env.BASE_URL}placeholder.svg` },
              },
            ],
          });
        }
      },

      removeFromCart: (itemId) => {
        set({ cartItems: get().cartItems.filter((i) => i.id !== itemId) });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }
        set({
          cartItems: get().cartItems.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ cartItems: [] }),
    }),
    { name: "unitech-cart" }
  )
);
