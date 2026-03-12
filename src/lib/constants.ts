import { Speaker, Home, Car, Satellite, Sliders, Volume2, Monitor, Mic, LayoutGrid } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const SITE_NAME = "Unitech India";
export const SITE_TAGLINE = "Expand Your Life";
export const SITE_DESCRIPTION = "Manufacturing premium audio equipment and electronics since 1999. Trusted by professionals across India.";

export interface Category {
  slug: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  { slug: "tower-speakers", label: "Tower Speakers", icon: Speaker },
  { slug: "home-theatre-systems", label: "Home Theatre", icon: Home },
  { slug: "car-stereo-systems", label: "Car Audio", icon: Car },
  { slug: "dth-receivers", label: "DTH Receivers", icon: Satellite },
  { slug: "audio-amplifiers", label: "Amplifiers", icon: Sliders },
  { slug: "portable-speakers", label: "Portable Speakers", icon: Volume2 },
  { slug: "multimedia-speakers", label: "Multimedia", icon: Monitor },
  { slug: "karaoke-systems", label: "Karaoke", icon: Mic },
  { slug: "all", label: "All Products", icon: LayoutGrid },
];

export const CURRENCY_SYMBOL = "₹";

export const formatPrice = (price: number | null) => {
  if (price === null) return "Price on Request";
  return `${CURRENCY_SYMBOL}${price.toLocaleString("en-IN")}`;
};
