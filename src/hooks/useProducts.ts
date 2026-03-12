import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  category: string;
  brand: string | null;
  price: number | null;
  original_price: number | null;
  discount_percent: number;
  rating: number;
  reviews_count: number;
  stock: number;
  is_featured: boolean;
  is_trending: boolean;
}

// Static fallback products for when Supabase is not configured
const fallbackProducts: Product[] = [
  { id: "1", name: "5.1 Tower Speaker System – 1200W", description: "Premium tower speakers with deep bass", image_url: "/placeholder.svg", category: "tower-speakers", brand: "Unitech", price: 24999, original_price: 34999, discount_percent: 29, rating: 4.8, reviews_count: 245, stock: 50, is_featured: true, is_trending: true },
  { id: "2", name: "Home Theatre System – Dolby Atmos", description: "Immersive surround sound experience", image_url: "/placeholder.svg", category: "home-theatre-systems", brand: "Unitech", price: 18999, original_price: 27999, discount_percent: 32, rating: 4.7, reviews_count: 189, stock: 35, is_featured: true, is_trending: false },
  { id: "3", name: "Car Stereo System – Bluetooth 5.0", description: "Crystal clear car audio", image_url: "/placeholder.svg", category: "car-stereo-systems", brand: "Unitech", price: 4999, original_price: 6999, discount_percent: 29, rating: 4.6, reviews_count: 312, stock: 100, is_featured: false, is_trending: true },
  { id: "4", name: "DTH Set Top Box – HD Ready", description: "Free-to-air DTH receiver", image_url: "/placeholder.svg", category: "dth-receivers", brand: "Unitech", price: 1999, original_price: 2999, discount_percent: 33, rating: 4.5, reviews_count: 456, stock: 200, is_featured: true, is_trending: false },
  { id: "5", name: "Audio Amplifier – 500W RMS", description: "Professional grade amplifier", image_url: "/placeholder.svg", category: "audio-amplifiers", brand: "Unitech", price: 7999, original_price: 11999, discount_percent: 33, rating: 4.9, reviews_count: 178, stock: 40, is_featured: true, is_trending: true },
  { id: "6", name: "Portable Bluetooth Speaker", description: "Wireless outdoor speaker with 20hr battery", image_url: "/placeholder.svg", category: "portable-speakers", brand: "Unitech", price: 2499, original_price: 3999, discount_percent: 38, rating: 4.4, reviews_count: 523, stock: 150, is_featured: false, is_trending: true },
  { id: "7", name: "Multimedia Speaker 2.1 System", description: "Desktop multimedia speakers", image_url: "/placeholder.svg", category: "multimedia-speakers", brand: "Unitech", price: 3499, original_price: 4999, discount_percent: 30, rating: 4.3, reviews_count: 267, stock: 80, is_featured: false, is_trending: false },
  { id: "8", name: "Karaoke System with Wireless Mic", description: "Party karaoke setup", image_url: "/placeholder.svg", category: "karaoke-systems", brand: "Unitech", price: 5999, original_price: 8999, discount_percent: 33, rating: 4.6, reviews_count: 134, stock: 60, is_featured: true, is_trending: false },
];

export const useProducts = (category?: string) => {
  return useQuery({
    queryKey: ["products", category],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured) {
        return category
          ? fallbackProducts.filter((p) => p.category === category)
          : fallbackProducts;
      }

      let query = supabase.from("products").select("*");
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured) return fallbackProducts.filter((p) => p.is_featured);
      const { data, error } = await supabase.from("products").select("*").eq("is_featured", true);
      if (error) throw error;
      return data || [];
    },
  });
};

export const useTrendingProducts = () => {
  return useQuery({
    queryKey: ["products", "trending"],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured) return fallbackProducts.filter((p) => p.is_trending);
      const { data, error } = await supabase.from("products").select("*").eq("is_trending", true);
      if (error) throw error;
      return data || [];
    },
  });
};
