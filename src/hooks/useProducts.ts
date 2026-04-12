import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { Collection } from "@/lib/constants";
import { isPlaceholderImage } from "@/lib/constants";

/* ── Product type (single source of truth) ─────────── */

export interface ProductSpecs {
  [key: string]: string | number | boolean | string[];
}

export interface ProductVariant {
  id: string;
  variant_name: string;
  variant_type?: string;
  price: number;
  original_price?: number;
  discounted_price?: number;
}

export interface ProductSibling {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  discounted_price?: number | null;
  image_url: string;
  variant_display_name: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  brand: string | null;
  model_number: string | null;

  // Pricing
  price: number | null;
  original_price: number | null;
  discounted_price?: number | null;

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

  // Variants (optional — from product_variants table)
  variants?: ProductVariant[];

  // Variant grouping (products linked by variant_group_id)
  variant_group_id?: string | null;
  variant_group_label?: string | null;
  variant_display_name?: string | null;
  siblings?: ProductSibling[];

  // Timestamps
  created_at: string;
  updated_at: string;
}

/** Raw row shape returned by Supabase when joining categories */
type RawProduct = Omit<Product, "category"> & {
  category_id: string | null;
  categories: { name: string; slug: string }[] | { name: string; slug: string } | null;
};

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

/**
 * Generate a deterministic but realistic-looking rating & review count
 * for products that have no ratings yet (rating === 0).
 * Uses a simple hash of the product ID so values stay stable across refreshes.
 */
const simpleHash = (str: string): number => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

const normalizeVariants = (raw: unknown): ProductVariant[] | undefined => {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw
    .filter((v): v is Record<string, unknown> => v != null && typeof v === "object" && typeof (v as Record<string, unknown>).id === "string")
    .map((v) => ({
      id: String(v.id),
      variant_name: String(v.variant_name ?? ""),
      variant_type: v.variant_type != null ? String(v.variant_type) : undefined,
      price: typeof v.price === "number" && Number.isFinite(v.price) ? v.price : 0,
      original_price: typeof v.original_price === "number" && Number.isFinite(v.original_price) ? v.original_price : undefined,
      discounted_price: typeof v.discounted_price === "number" && Number.isFinite(v.discounted_price) ? v.discounted_price : undefined,
    }));
};

const generatePlaceholderRating = (id: string): { rating: number; reviews_count: number } => {
  const h = simpleHash(id);
  // Rating between 3.6 and 4.5 — realistic average range
  const rating = 3.6 + ((h % 10) / 10) * 0.9;
  // Reviews between 24 and 387
  const reviews_count = 24 + (h % 364);
  return {
    rating: Math.round(rating * 10) / 10,
    reviews_count,
  };
};

const normalizeProduct = (product: RawProduct | Product): Product => {
  const rawRating = toNonNegativeNumber(product.rating);
  const rawReviews = Math.floor(toNonNegativeNumber(product.reviews_count));
  const needsPlaceholder = rawRating === 0 && rawReviews === 0;
  const placeholder = needsPlaceholder ? generatePlaceholderRating(product.id) : null;

  const raw = product as RawProduct;

  return {
  ...product,
  name: (product.name || "").trim(),
  slug: (product.slug || "").trim(),
  description: product.description ?? "",
  category: (Array.isArray(raw.categories) ? raw.categories[0]?.slug : raw.categories?.slug) ?? raw.category_id ?? (product as Product).category ?? "",
  brand: product.brand ?? "",
  model_number: product.model_number ?? "",
  price: toNumberOrNull(product.price),
  original_price: toNumberOrNull(product.original_price),
  discounted_price: toNumberOrNull(product.discounted_price),
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
  rating: placeholder ? placeholder.rating : rawRating,
  reviews_count: placeholder ? placeholder.reviews_count : rawReviews,
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
  variants: normalizeVariants((product as Record<string, unknown>).product_variants ?? (product as Product).variants),
  variant_group_id: (product as Record<string, unknown>).variant_group_id as string | null ?? null,
  variant_group_label: (product as Record<string, unknown>).variant_group_label as string | null ?? null,
  variant_display_name: (product as Record<string, unknown>).variant_display_name as string | null ?? null,
};
};

const PRODUCT_SELECT_FIELDS = `
  id,
  name,
  slug,
  description,
  category_id,
  categories!category_id(name, slug),
  brand,
  model_number,
  price,
  original_price,
  discounted_price,
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
  product_variants(id, variant_name, variant_type, price, original_price, discounted_price),
  variant_group_id,
  variant_group_label,
  variant_display_name,
  created_at,
  updated_at
`;

/** Lean select for listing/card views – omits heavy JSONB and text fields */
const PRODUCT_LIST_FIELDS = `
  id,
  name,
  slug,
  category_id,
  categories!category_id(name, slug),
  brand,
  price,
  original_price,
  discounted_price,
  image_url,
  collections,
  is_featured,
  is_active,
  stock,
  rating,
  reviews_count,
  sale_start,
  sale_end,
  product_variants(id, variant_name, variant_type, price, original_price, discounted_price),
  variant_group_id,
  variant_group_label,
  variant_display_name,
  created_at,
  updated_at
`;

type ProductQueryOptions = {
  includeDemo?: boolean;
  /** Max rows to fetch from Supabase (omit for unlimited) */
  limit?: number;
  /** Pass false to disable the query (e.g. until a modal is open) */
  enabled?: boolean;
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

  return hasDemoTag || hasDemoName;
};

const applyPublicCatalogFilter = (products: Product[], includeDemo: boolean): Product[] => {
  if (includeDemo) return products;
  return products.filter((product) => !isLikelyDemoProduct(product));
};

/**
 * Group products that share a variant_group_id.
 * Returns the cheapest product per group as the "primary" card,
 * with all group members (including itself) attached as siblings.
 * Products with no variant_group_id pass through unchanged.
 */
const groupVariantProducts = (products: Product[]): Product[] => {
  const groups = new Map<string, Product[]>();
  const ungrouped: Product[] = [];

  for (const p of products) {
    if (p.variant_group_id) {
      const arr = groups.get(p.variant_group_id) ?? [];
      arr.push(p);
      groups.set(p.variant_group_id, arr);
    } else {
      ungrouped.push(p);
    }
  }

  const grouped: Product[] = [];
  for (const members of groups.values()) {
    // Sort by effective price (cheapest first)
    members.sort((a, b) => {
      const pa = a.discounted_price ?? a.price ?? Infinity;
      const pb = b.discounted_price ?? b.price ?? Infinity;
      return pa - pb;
    });

    const primary = members[0];
    const siblings: ProductSibling[] = members.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      price: m.price,
      discounted_price: m.discounted_price,
      image_url: m.image_url,
      variant_display_name: m.variant_display_name || m.name,
    }));

    grouped.push({ ...primary, siblings });
  }

  return [...ungrouped, ...grouped];
};

/* ── Hooks ─────────────────────────────────────────── */

export const useProducts = (category?: string, options?: ProductQueryOptions) => {
  const includeDemo = options?.includeDemo ?? !HIDE_DEMO_PRODUCTS_BY_DEFAULT;
  const limit = options?.limit;
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ["products", category, includeDemo, limit],
    enabled,
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured) {
        let items = fallbackProducts.filter((p) => p.is_active);
        if (category) items = items.filter((p) => p.category === category);
        const result = applyPublicCatalogFilter(items.map(normalizeProduct), includeDemo);
        return limit ? result.slice(0, limit) : result;
      }

      let query = supabase.from("products").select(PRODUCT_LIST_FIELDS).eq("is_active", true);
      if (category) {
        const { data: catData } = await supabase!
          .from("categories")
          .select("id")
          .eq("slug", category)
          .maybeSingle();
        if (!catData) return [];
        query = query.eq("category_id", catData.id);
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return groupVariantProducts(applyPublicCatalogFilter(((data as unknown as RawProduct[]) || []).map(normalizeProduct), includeDemo));
    },
  });
};

export const useFeaturedProducts = (options?: ProductQueryOptions) => {
  const includeDemo = options?.includeDemo ?? !HIDE_DEMO_PRODUCTS_BY_DEFAULT;
  const limit = options?.limit ?? 16;

  return useQuery({
    queryKey: ["products", "featured", includeDemo, limit],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured)
        return applyPublicCatalogFilter(
          fallbackProducts.filter((p) => p.is_featured && p.is_active).map(normalizeProduct),
          includeDemo
        ).slice(0, limit);
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_LIST_FIELDS)
        .eq("is_featured", true)
        .eq("is_active", true)
        .limit(limit);
      if (error) throw error;
      return groupVariantProducts(applyPublicCatalogFilter(((data as unknown as RawProduct[]) || []).map(normalizeProduct), includeDemo));
    },
  });
};

export const useProductsByCollection = (collection: Collection | Collection[], options?: ProductQueryOptions) => {
  const includeDemo = options?.includeDemo ?? !HIDE_DEMO_PRODUCTS_BY_DEFAULT;
  const limit = options?.limit ?? 20;
  const collections = Array.isArray(collection) ? collection : [collection];
  const normalizedCollections = collections.filter((item): item is Collection => typeof item === "string");

  return useQuery({
    queryKey: ["products", "collection", ...normalizedCollections, includeDemo, limit],
    queryFn: async (): Promise<Product[]> => {
      if (normalizedCollections.length === 0) return [];

      if (!isSupabaseConfigured)
        return applyPublicCatalogFilter(
          fallbackProducts.filter(
            (p) => p.is_active && normalizedCollections.some((entry) => p.collections.includes(entry))
          ).map(normalizeProduct),
          includeDemo
        ).slice(0, limit);
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_LIST_FIELDS)
        .overlaps("collections", normalizedCollections)
        .eq("is_active", true)
        .limit(limit);
      if (error) throw error;
      return groupVariantProducts(applyPublicCatalogFilter(((data as unknown as RawProduct[]) || []).map(normalizeProduct), includeDemo));
    },
  });
};

/**
 * Fetch a single product by slug with its variant group siblings.
 * Used by ProductDetail to find any product (including non-primary siblings).
 */
export const useProductBySlug = (slug?: string) => {
  return useQuery({
    queryKey: ["product", "slug", slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<Product | null> => {
      if (!slug) return null;

      if (!isSupabaseConfigured) {
        const found = fallbackProducts.find((p) => p.slug === slug);
        return found ? normalizeProduct(found) : null;
      }

      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT_FIELDS)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const product = normalizeProduct(data as RawProduct);

      // Fetch siblings if this product belongs to a variant group
      if (product.variant_group_id) {
        const { data: siblingRows } = await supabase
          .from("products")
          .select("id, name, slug, price, discounted_price, image_url, variant_display_name")
          .eq("variant_group_id", product.variant_group_id)
          .eq("is_active", true)
          .order("price");
        if (siblingRows && siblingRows.length > 1) {
          product.siblings = (siblingRows as Array<{
            id: string; name: string; slug: string;
            price: number | null; discounted_price: number | null;
            image_url: string; variant_display_name: string | null;
          }>).map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            price: s.price,
            discounted_price: s.discounted_price,
            image_url: s.image_url || "",
            variant_display_name: s.variant_display_name || s.name,
          }));
        }
      }

      return product;
    },
  });
};
