import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { Collection } from "@/lib/constants";
import { isPlaceholderImage } from "@/lib/constants";

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

  // Rich product content (optional)
  short_tagline?: string | null;
  highlights?: string[] | null;
  perfect_for?: string[] | null;
  faqs?: Array<{ question?: string; answer?: string; q?: string; a?: string }> | null;
  seo_meta_description?: string | null;

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

const PRODUCT_SELECT_FIELDS = `
  id,
  name,
  slug,
  description,
  category,
  brand,
  model_number,
  price,
  original_price,
  image_url,
  images,
  collections,
  is_featured,
  is_active,
  stock,
  sku,
  rating,
  reviews_count,
  specs,
  short_tagline,
  highlights,
  perfect_for,
  faqs,
  seo_meta_description,
  sale_start,
  sale_end,
  created_at,
  updated_at
`;

type ProductQueryOptions = {
  includeDemo?: boolean;
};

const HIDE_DEMO_PRODUCTS_BY_DEFAULT =
  (import.meta.env.VITE_HIDE_DEMO_PRODUCTS ?? (import.meta.env.PROD ? "true" : "false")) === "true";

const isLikelyDemoProduct = (product: Product): boolean => {
  const name = (product.name || "").toLowerCase();
  const model = (product.model_number || "").toLowerCase();
  const sku = (product.sku || "").toLowerCase();
  const tags = ((product.collections as unknown) as string[]) || [];

  const hasDemoTag = tags.some((tag) => ["demo", "mock", "sample", "test"].includes(String(tag).toLowerCase()));
  const hasDemoName = /\b(demo|mock|sample|test)\b/i.test(name);
  const hasUtPrefix = sku.startsWith("ut-") || model.startsWith("ut-");
  const hasPlaceholderMedia =
    isPlaceholderImage(product.image_url) &&
    (!product.images || product.images.length === 0 || product.images.every((img) => isPlaceholderImage(img)));

  return hasDemoTag || hasDemoName || (hasUtPrefix && hasPlaceholderMedia);
};

const applyPublicCatalogFilter = (products: Product[], includeDemo: boolean): Product[] => {
  if (includeDemo) return products;
  return products.filter((product) => !isLikelyDemoProduct(product));
};

/* ── Hooks ─────────────────────────────────────────── */

export const useProducts = (category?: string, options?: ProductQueryOptions) => {
  const includeDemo = options?.includeDemo ?? !HIDE_DEMO_PRODUCTS_BY_DEFAULT;

  return useQuery({
    queryKey: ["products", category, includeDemo],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured) {
        let items = fallbackProducts.filter((p) => p.is_active);
        if (category) items = items.filter((p) => p.category === category);
        return applyPublicCatalogFilter(items, includeDemo);
      }

      let query = supabase.from("products").select(PRODUCT_SELECT_FIELDS).eq("is_active", true);
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) throw error;
      return applyPublicCatalogFilter((data as Product[]) || [], includeDemo);
    },
  });
};

export const useFeaturedProducts = (options?: ProductQueryOptions) => {
  const includeDemo = options?.includeDemo ?? !HIDE_DEMO_PRODUCTS_BY_DEFAULT;

  return useQuery({
    queryKey: ["products", "featured", includeDemo],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured)
        return applyPublicCatalogFilter(
          fallbackProducts.filter((p) => p.is_featured && p.is_active),
          includeDemo
        );
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT_FIELDS)
        .eq("is_featured", true)
        .eq("is_active", true);
      if (error) throw error;
      return applyPublicCatalogFilter((data as Product[]) || [], includeDemo);
    },
  });
};

export const useProductsByCollection = (collection: Collection, options?: ProductQueryOptions) => {
  const includeDemo = options?.includeDemo ?? !HIDE_DEMO_PRODUCTS_BY_DEFAULT;

  return useQuery({
    queryKey: ["products", "collection", collection, includeDemo],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured)
        return applyPublicCatalogFilter(
          fallbackProducts.filter(
            (p) => p.is_active && p.collections.includes(collection)
          ),
          includeDemo
        );
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT_FIELDS)
        .contains("collections", [collection])
        .eq("is_active", true);
      if (error) throw error;
      return applyPublicCatalogFilter((data as Product[]) || [], includeDemo);
    },
  });
};
