import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import seedProducts from "@/data/seedProducts";
import type { Product } from "@/hooks/useProducts";

/* ── Local store (pre-Supabase fallback) ───────────── */

let localProducts: Product[] = [...seedProducts];

const getLocal = () => [...localProducts];
const setLocal = (products: Product[]) => { localProducts = products; };

/* ── Admin: fetch ALL products (incl. inactive) ────── */

export const useAdminProducts = () =>
  useQuery({
    queryKey: ["admin-products"],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured) return getLocal();
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Product[]) ?? [];
    },
  });

/* ── Mutations ─────────────────────────────────────── */

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      if (!isSupabaseConfigured) {
        setLocal([product, ...getLocal()]);
        return product;
      }
      const { data, error } = await supabase.from("products").insert(product).select().single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      if (!isSupabaseConfigured) {
        setLocal(getLocal().map((p) => (p.id === product.id ? product : p)));
        return product;
      }
      const { data, error } = await supabase.from("products").update(product).eq("id", product.id).select().single();
      if (error) throw error;
      return data as Product;
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
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
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
      const { error } = await supabase.from("products").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
