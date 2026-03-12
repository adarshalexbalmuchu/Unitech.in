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

const now = new Date().toISOString();

const fallbackProducts: Product[] = [
  { id: "1", name: "5.1 Tower Speaker System – 1200W", slug: "tower-speaker-1200w", description: "Premium tower speakers with deep bass", image_url: "/placeholder.svg", images: [], category: "tower-speakers", brand: "Unitech", model_number: "UT-TW1200", price: 24999, original_price: 34999, rating: 4.8, reviews_count: 245, stock: 50, sku: "UT-TW1200-BLK", is_featured: true, is_active: true, collections: ["hot-selling"], specs: { wattage: 1200, channels: "5.1", driver_size: "8 inch", connectivity: ["Bluetooth", "USB", "AUX"] }, sale_start: null, sale_end: null, created_at: now, updated_at: now },
  { id: "2", name: "Home Theatre System – Dolby Atmos", slug: "home-theatre-dolby-atmos", description: "Immersive surround sound experience", image_url: "/placeholder.svg", images: [], category: "home-theatre-systems", brand: "Unitech", model_number: "UT-HT500", price: 18999, original_price: 27999, rating: 4.7, reviews_count: 189, stock: 35, sku: "UT-HT500-BLK", is_featured: true, is_active: true, collections: ["hot-selling"], specs: { wattage: 500, channels: "5.1", dolby_atmos: true }, sale_start: null, sale_end: null, created_at: now, updated_at: now },
  { id: "3", name: "Car Stereo System – Bluetooth 5.0", slug: "car-stereo-bt5", description: "Crystal clear car audio", image_url: "/placeholder.svg", images: [], category: "car-audio", brand: "Unitech", model_number: "UT-CA200", price: 4999, original_price: 6999, rating: 4.6, reviews_count: 312, stock: 100, sku: "UT-CA200", is_featured: false, is_active: true, collections: ["new-arrivals"], specs: { wattage: 200, din_size: "2-DIN", bluetooth: true, screen_size: "7 inch" }, sale_start: null, sale_end: null, created_at: now, updated_at: now },
  { id: "4", name: "DTH Set Top Box – HD Ready", slug: "dth-hd-ready", description: "Free-to-air DTH receiver", image_url: "/placeholder.svg", images: [], category: "dth-receivers", brand: "Unitech", model_number: "UT-DTH100", price: 1999, original_price: 2999, rating: 4.5, reviews_count: 456, stock: 200, sku: "UT-DTH100", is_featured: true, is_active: true, collections: [], specs: { hd_ready: true, recording: true, hdmi_ports: 1 }, sale_start: null, sale_end: null, created_at: now, updated_at: now },
  { id: "5", name: "Audio Amplifier – 500W RMS", slug: "amplifier-500w-rms", description: "Professional grade amplifier", image_url: "/placeholder.svg", images: [], category: "audio-amplifiers", brand: "Unitech", model_number: "UT-AMP500", price: 7999, original_price: 11999, rating: 4.9, reviews_count: 178, stock: 40, sku: "UT-AMP500", is_featured: true, is_active: true, collections: ["hot-selling", "flash-sale"], specs: { wattage: 500, channels: 2, impedance: "4-8 ohm" }, sale_start: now, sale_end: null, created_at: now, updated_at: now },
  { id: "6", name: "32\" TV Kit – LED Panel", slug: "tv-kit-32-led", description: "Assemble your own 32-inch LED TV", image_url: "/placeholder.svg", images: [], category: "tv-kits", brand: "Unitech", model_number: "UT-TVK32", price: 5499, original_price: 7999, rating: 4.3, reviews_count: 89, stock: 60, sku: "UT-TVK32", is_featured: false, is_active: true, collections: ["new-arrivals"], specs: { screen_size: "32 inch", resolution: "HD Ready", panel_type: "LED" }, sale_start: null, sale_end: null, created_at: now, updated_at: now },
  { id: "7", name: "Universal TV Wall Mount – 32-55\"", slug: "wall-mount-32-55", description: "Tilt & swivel wall mount bracket", image_url: "/placeholder.svg", images: [], category: "stands-mounts", brand: "Unitech", model_number: "UT-WM55", price: 1299, original_price: 1999, rating: 4.4, reviews_count: 267, stock: 150, sku: "UT-WM55", is_featured: false, is_active: true, collections: [], specs: { max_screen: "55 inch", max_weight: "40 kg", tilt: true, swivel: true }, sale_start: null, sale_end: null, created_at: now, updated_at: now },
  { id: "8", name: "6-Socket Power Strip with Surge Protection", slug: "power-strip-6s", description: "Heavy duty power strip", image_url: "/placeholder.svg", images: [], category: "power-accessories", brand: "Unitech", model_number: "UT-PS06", price: 799, original_price: 1199, rating: 4.2, reviews_count: 534, stock: 300, sku: "UT-PS06", is_featured: false, is_active: true, collections: [], specs: { sockets: 6, surge_protection: true, cord_length: "3m", voltage: "240V" }, sale_start: null, sale_end: null, created_at: now, updated_at: now },
];

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
