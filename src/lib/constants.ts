import {
  Speaker,
  Home,
  Car,
  Satellite,
  Sliders,
  Monitor,
  Columns3,
  Plug,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const SITE_NAME = "Unitech India";
export const SITE_TAGLINE = "Expand Your Life";
export const SITE_DESCRIPTION =
  "Manufacturing premium audio equipment and electronics since 1999. Trusted by professionals across India.";

/* ── Category taxonomy ─────────────────────────────── */

export interface Category {
  slug: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  { slug: "tower-speakers", label: "Tower Speakers", icon: Speaker },
  { slug: "home-theatre-systems", label: "Home Theatre Systems", icon: Home },
  { slug: "dth-receivers", label: "DTH Receivers", icon: Satellite },
  { slug: "car-audio", label: "Car Audio", icon: Car },
  { slug: "audio-amplifiers", label: "Audio Amplifiers", icon: Sliders },
  { slug: "tv-kits", label: "TV Kits & LED Panels", icon: Monitor },
  { slug: "stands-mounts", label: "Stands & Mounts", icon: Columns3 },
  { slug: "power-accessories", label: "Power Accessories", icon: Plug },
];

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

/* ── Collections (tags, not categories) ────────────── */

export const COLLECTIONS = ["hot-selling", "new-arrivals", "flash-sale"] as const;
export type Collection = (typeof COLLECTIONS)[number];

/* ── Pricing helpers ───────────────────────────────── */

export const CURRENCY_SYMBOL = "₹";

export const formatPrice = (price: number | null) => {
  if (price === null) return "Price on Request";
  return `${CURRENCY_SYMBOL}${price.toLocaleString("en-IN")}`;
};

/** Derive discount percentage from price & original_price */
export const getDiscountPercent = (
  price: number | null,
  originalPrice: number | null
): number => {
  if (!price || !originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};
