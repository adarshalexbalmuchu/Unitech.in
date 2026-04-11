import {
  Speaker,
  Home,
  Car,
  Satellite,
  Sliders,
  Monitor,
  Columns3,
  Plug,
  Tv,
  Refrigerator,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
/** Check if an image URL is a placeholder (should show fallback icon instead) */
const LEGACY_PLACEHOLDER_FILENAMES = [
  "tower-speaker.jpg",
  "home-theatre.jpg",
  "dth.jpg",
  "car-audio.jpg",
  "power-accessory.jpg",
];

export const isPlaceholderImage = (url?: string | null): boolean => {
  const normalized = (url || "").trim().toLowerCase();
  if (!normalized) return true;
  if (normalized.includes("/placeholder.svg")) return true;
  if (normalized.includes("images/placeholders/")) return true;
  return LEGACY_PLACEHOLDER_FILENAMES.some((file) => normalized.endsWith(`/${file}`) || normalized === file);
};


export const SITE_NAME = "Unitech India";
export const SITE_TAGLINE = "Unitech hai jahan, Music hai vahan";
export const SITE_DESCRIPTION =
  "Manufacturing premium audio equipment and electronics since 1994. Trusted by professionals across India.";

export const WHATSAPP_NUMBER = "919810448343";

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
  { slug: "led-dth-stands", label: "LED/DTH Stands", icon: Tv },
  { slug: "appliances", label: "Appliances", icon: Refrigerator },
];

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

type FallbackCategorySlug = CategorySlug | "portable-speakers";

const CATEGORY_FALLBACK_LABELS: Record<FallbackCategorySlug, string> = {
  "tower-speakers": "Tower Speakers",
  "home-theatre-systems": "Home Theatre",
  "dth-receivers": "DTH Receivers",
  "car-audio": "Car Audio",
  "audio-amplifiers": "Audio Amplifiers",
  "tv-kits": "TV Kits",
  "stands-mounts": "Stands & Mounts",
  "power-accessories": "Power Accessories",
  "led-dth-stands": "LED/DTH Stands",
  "appliances": "Appliances",
  "portable-speakers": "Portable Speakers",
};

export const getCategoryFallbackImage = (category?: string | null): string => {
  const key = (category || "").toLowerCase() as FallbackCategorySlug;
  const label = CATEGORY_FALLBACK_LABELS[key] || "Unitech Product";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${label}"><rect width="600" height="600" fill="#1a1a1a"/><rect y="570" width="600" height="30" fill="#E8000D"/><text x="300" y="280" text-anchor="middle" font-family="Manrope, system-ui, sans-serif" font-size="32" font-weight="700" fill="#ffffff">${label}</text><text x="300" y="330" text-anchor="middle" font-family="Manrope, system-ui, sans-serif" font-size="16" fill="rgba(255,255,255,0.4)">Unitech India</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const resolvePrimaryProductImage = (
  imageUrl?: string | null,
  category?: string | null
): string => {
  if (imageUrl && !isPlaceholderImage(imageUrl)) return imageUrl;
  return getCategoryFallbackImage(category);
};

export const resolveProductGalleryImages = (
  images: string[] | null | undefined,
  imageUrl?: string | null,
  category?: string | null
): string[] => {
  const gallery = (images || [])
    .map((img) => img?.trim())
    .filter((img): img is string => Boolean(img) && !isPlaceholderImage(img));

  if (gallery.length > 0) return gallery;
  return [resolvePrimaryProductImage(imageUrl, category)];
};

/* ── Collections (tags, not categories) ────────────── */

export const COLLECTIONS = ["featured", "hot-selling", "new-arrivals", "flash-sale"] as const;
export type Collection = (typeof COLLECTIONS)[number];

/* ── Pricing helpers ───────────────────────────────── */

export const CURRENCY_SYMBOL = "₹";

/** Orders above this amount (in INR) get free shipping. Change this single value to adjust. */
export const FREE_SHIPPING_THRESHOLD = 2000;

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
