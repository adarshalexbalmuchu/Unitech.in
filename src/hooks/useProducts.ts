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

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
};

const toNonNegativeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, value);
};

const normalizeProduct = (product: Product): Product => ({
  ...product,
  name: (product.name || "").trim(),
  slug: (product.slug || "").trim(),
  description: product.description ?? "",
  category: (product.category || "").trim(),
  brand: product.brand ?? "",
  model_number: product.model_number ?? "",
  price: toNumberOrNull(product.price),
  original_price: toNumberOrNull(product.original_price),
  image_url: (product.image_url || "").trim(),
  images: Array.isArray(product.images)
    ? product.images.filter((img): img is string => typeof img === "string" && img.trim().length > 0)
    : [],
  collections: Array.isArray(product.collections)
    ? product.collections.filter((collection): collection is Collection => typeof collection === "string")
    : [],
  is_featured: Boolean(product.is_featured),
  is_active: Boolean(product.is_active),
  stock: Math.floor(toNonNegativeNumber(product.stock)),
  sku: product.sku ?? "",
  rating: toNonNegativeNumber(product.rating),
  reviews_count: Math.floor(toNonNegativeNumber(product.reviews_count)),
  specs: product.specs && typeof product.specs === "object" ? product.specs : {},
  short_tagline: product.short_tagline ?? "",
  highlights: Array.isArray(product.highlights)
    ? product.highlights.filter((item): item is string => typeof item === "string")
    : [],
  perfect_for: Array.isArray(product.perfect_for)
    ? product.perfect_for.filter((item): item is string => typeof item === "string")
    : [],
  faqs: Array.isArray(product.faqs) ? product.faqs : [],
  seo_meta_description: product.seo_meta_description ?? "",
  sale_start: product.sale_start ?? null,
  sale_end: product.sale_end ?? null,
});

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
        return applyPublicCatalogFilter(items.map(normalizeProduct), includeDemo);
      }

      let query = supabase.from("products").select(PRODUCT_SELECT_FIELDS).eq("is_active", true);
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) throw error;
      return applyPublicCatalogFilter(((data as Product[]) || []).map(normalizeProduct), includeDemo);
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
          fallbackProducts.filter((p) => p.is_featured && p.is_active).map(normalizeProduct),
          includeDemo
        );
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT_FIELDS)
        .eq("is_featured", true)
        .eq("is_active", true);
      if (error) throw error;
      return applyPublicCatalogFilter(((data as Product[]) || []).map(normalizeProduct), includeDemo);
    },
  });
};

export const useProductsByCollection = (collection: Collection | Collection[], options?: ProductQueryOptions) => {
  const includeDemo = options?.includeDemo ?? !HIDE_DEMO_PRODUCTS_BY_DEFAULT;
  const collections = Array.isArray(collection) ? collection : [collection];
  const normalizedCollections = collections.filter((item): item is Collection => typeof item === "string");

  return useQuery({
    queryKey: ["products", "collection", ...normalizedCollections, includeDemo],
    queryFn: async (): Promise<Product[]> => {
      if (normalizedCollections.length === 0) return [];

      if (!isSupabaseConfigured)
        return applyPublicCatalogFilter(
          fallbackProducts.filter(
            (p) => p.is_active && normalizedCollections.some((entry) => p.collections.includes(entry))
          ).map(normalizeProduct),
          includeDemo
        );
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT_FIELDS)
        .overlaps("collections", normalizedCollections)
        .eq("is_active", true);
      if (error) throw error;
      return applyPublicCatalogFilter(((data as Product[]) || []).map(normalizeProduct), includeDemo);
    },
  });
};
