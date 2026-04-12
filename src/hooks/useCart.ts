import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
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
  addToCart: (productId: string, product?: { name: string; price: number; image_url: string }, variantId?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const MAX_CART_ITEM_QUANTITY = 99;

const normalizePrice = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, value);
};

const normalizeQuantity = (value: number): number => {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(MAX_CART_ITEM_QUANTITY, Math.floor(value)));
};

const normalizeProductPayload = (product?: { name: string; price: number; image_url: string }) => ({
  name: (product?.name || "Product").trim() || "Product",
  price: normalizePrice(product?.price),
  image_url: (product?.image_url || "").trim(),
});

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      cartItems: [],
      loading: false,

      addToCart: (productId, product, variantId) => {
        const normalizedProductId = productId?.trim();
        if (!normalizedProductId) return;

        const items = get().cartItems;
        const existing = items.find((i) => i.product_id === normalizedProductId && i.variant_id === variantId);
        if (existing) {
          set({
            cartItems: items.map((i) =>
              i.product_id === normalizedProductId && i.variant_id === variantId
                ? { ...i, quantity: normalizeQuantity(i.quantity + 1) }
                : i
            ),
          });
        } else {
          set({
            cartItems: [
              ...items,
              {
                id: crypto.randomUUID(),
                product_id: normalizedProductId,
                variant_id: variantId,
                quantity: 1,
                product: normalizeProductPayload(product),
              },
            ],
          });
        }
      },

      removeFromCart: (itemId) => {
        if (!itemId) return;
        set({ cartItems: get().cartItems.filter((i) => i.id !== itemId) });
      },

      updateQuantity: (itemId, quantity) => {
        if (!itemId) return;
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }

        const safeQuantity = normalizeQuantity(quantity);

        set({
          cartItems: get().cartItems.map((i) =>
            i.id === itemId ? { ...i, quantity: safeQuantity } : i
          ),
        });
      },

      clearCart: () => set({ cartItems: [] }),
    }),
    { name: "unitech-cart" }
  )
);

/** Derived selector – always reactive */
export const useCartCount = () =>
  useCart((s) => s.cartItems.reduce((sum, item) => sum + item.quantity, 0));

export const useCartTotal = () =>
  useCart((s) => s.cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
