import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import seedProducts from "@/data/seedProducts";
import type { Product } from "@/hooks/useProducts";
import type { Collection } from "@/lib/constants";

type RawAdminProduct = Omit<Product, "category"> & {
  category_id: string | null;
  categories: { name: string; slug: string }[] | { name: string; slug: string } | null;
};

const normalizeProductForWrite = (product: Product): Product => ({
  ...product,
  name: (product.name || "").trim(),
  slug: (product.slug || "").trim(),
  description: product.description ?? "",
  category: (product.category || "").trim(),
  brand: product.brand ?? "",
  model_number: product.model_number ?? "",
  price: typeof product.price === "number" && Number.isFinite(product.price) ? Math.max(0, product.price) : null,
  original_price:
    typeof product.original_price === "number" && Number.isFinite(product.original_price)
      ? Math.max(0, product.original_price)
      : null,
  image_url: (product.image_url || "").trim(),
  images: Array.isArray(product.images)
    ? product.images.filter((img): img is string => typeof img === "string" && img.trim().length > 0)
    : [],
  collections: Array.isArray(product.collections)
    ? product.collections.filter((collection): collection is Collection => typeof collection === "string")
    : [],
  stock: Math.max(0, Math.floor(product.stock || 0)),
  sku: product.sku ?? "",
  rating: typeof product.rating === "number" && Number.isFinite(product.rating) ? product.rating : 0,
  reviews_count:
    typeof product.reviews_count === "number" && Number.isFinite(product.reviews_count)
      ? Math.max(0, Math.floor(product.reviews_count))
      : 0,
  specs: product.specs && typeof product.specs === "object" ? product.specs : {},
});

/* ── Local store (pre-Supabase fallback) ───────────── */

let localProducts: Product[] = [...seedProducts];

const getLocal = () => [...localProducts];
const setLocal = (products: Product[]) => { localProducts = products; };

/* ── Admin: fetch ALL products (incl. inactive) ────── */

const normalizeAdminProduct = (raw: RawAdminProduct): Product => ({
  ...(raw as unknown as Product),
  category: (Array.isArray(raw.categories) ? raw.categories[0]?.slug : raw.categories?.slug) ?? "",
});

export const useAdminProducts = () =>
  useQuery({
    queryKey: ["admin-products"],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured) return getLocal();
      const { data, error } = await supabase!.from("products").select(`
        *,
        categories!category_id(name, slug)
      `).order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as RawAdminProduct[]) ?? []).map(normalizeAdminProduct);
    },
  });

/* ── Mutations ─────────────────────────────────────── */

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      const payload = normalizeProductForWrite(product);
      if (!isSupabaseConfigured) {
        setLocal([payload, ...getLocal()]);
        return payload;
      }
      const { data: cat } = await supabase!
        .from("categories")
        .select("id")
        .eq("slug", payload.category)
        .maybeSingle();
      const dbPayload: Record<string, unknown> = { ...payload, category_id: cat?.id ?? null };
      delete dbPayload.category;
      const { data, error } = await supabase!.from("products").insert(dbPayload).select(`
        *,
        categories!category_id(name, slug)
      `).single();
      if (error) throw error;
      return normalizeAdminProduct(data as RawAdminProduct);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      const payload = normalizeProductForWrite(product);
      if (!isSupabaseConfigured) {
        setLocal(getLocal().map((p) => (p.id === payload.id ? payload : p)));
        return payload;
      }
      const { data: cat } = await supabase!
        .from("categories")
        .select("id")
        .eq("slug", payload.category)
        .maybeSingle();
      const dbPayload: Record<string, unknown> = { ...payload, category_id: cat?.id ?? null };
      delete dbPayload.category;
      const { data, error } = await supabase!.from("products").update(dbPayload).eq("id", payload.id).select(`
        *,
        categories!category_id(name, slug)
      `).single();
      if (error) throw error;
      return normalizeAdminProduct(data as RawAdminProduct);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) {
        setLocal(getLocal().filter((p) => p.id !== id));
        return;
      }
      if (!supabase) throw new Error("Backend not configured");
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useToggleProductField = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: "is_active" | "is_featured"; value: boolean }) => {
      if (!isSupabaseConfigured) {
        setLocal(getLocal().map((p) => (p.id === id ? { ...p, [field]: value } : p)));
        return;
      }
      if (!supabase) throw new Error("Backend not configured");
      const { error } = await supabase.from("products").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
