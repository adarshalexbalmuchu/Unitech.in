import { create } from "zustand";
import type { ProductSpecs } from "@/hooks/useProducts";

interface CompareProduct {
  id: string;
  name: string;
  image_url: string;
  price: number | null;
  discounted_price: number | null;
  original_price: number | null;
  rating: number;
  category: string;
  brand: string | null;
  description: string | null;
  specs: ProductSpecs;
}

interface CompareStore {
  compareProducts: CompareProduct[];
  addToCompare: (product: CompareProduct) => void;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
}

export const useCompare = create<CompareStore>((set, get) => ({
  compareProducts: [],

  addToCompare: (product) => {
    if (get().compareProducts.length >= 4) return;
    if (get().isInCompare(product.id)) return;
    set({ compareProducts: [...get().compareProducts, product] });
  },

  removeFromCompare: (productId) => {
    set({ compareProducts: get().compareProducts.filter((p) => p.id !== productId) });
  },

  isInCompare: (productId) => {
    return get().compareProducts.some((p) => p.id === productId);
  },

  clearCompare: () => set({ compareProducts: [] }),
}));
