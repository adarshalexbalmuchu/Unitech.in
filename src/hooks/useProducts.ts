import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { Collection } from "@/lib/constants";

/* ── Product type (single source of truth) ─────────── */

export interface ProductSpecs {
  [key: string]: string | number | boolean | string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  brand: string | null;
  model_number: string | null;

  // Pricing – discount is derived, not stored
  price: number | null;
  original_price: number | null;

  // Media
  image_url: string;
  images: string[];

  // Catalogue flags
  collections: Collection[];
  is_featured: boolean;
  is_active: boolean;

  // Inventory
  stock: number;
  sku: string | null;

  // Ratings (denormalised)
  rating: number;
  reviews_count: number;

  // Category-specific specs
  specs: ProductSpecs;

  // Sale window
  sale_start: string | null;
  sale_end: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/* ── Fallback data (offline / pre-Supabase) ────────── */

import seedProducts from "@/data/seedProducts";
const fallbackProducts: Product[] = seedProducts;

/* ── Hooks ─────────────────────────────────────────── */

export const useProducts = (category?: string) => {
  return useQuery({
    queryKey: ["products", category],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured) {
        let items = fallbackProducts.filter((p) => p.is_active);
        if (category) items = items.filter((p) => p.category === category);
        return items;
      }

      let query = supabase.from("products").select("*").eq("is_active", true);
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) throw error;
      return (data as Product[]) || [];
    },
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured)
        return fallbackProducts.filter((p) => p.is_featured && p.is_active);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_featured", true)
        .eq("is_active", true);
      if (error) throw error;
      return (data as Product[]) || [];
    },
  });
};

export const useProductsByCollection = (collection: Collection) => {
  return useQuery({
    queryKey: ["products", "collection", collection],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured)
        return fallbackProducts.filter(
          (p) => p.is_active && p.collections.includes(collection)
        );
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .contains("collections", [collection])
        .eq("is_active", true);
      if (error) throw error;
      return (data as Product[]) || [];
    },
  });
};
