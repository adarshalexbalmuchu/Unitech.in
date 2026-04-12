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
  Bluetooth,
  Volume2,
  Disc3,
  Cable,
  Zap,
  Wrench,
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

export interface CategoryGroup {
  label: string;
  categories: Category[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: "Audio",
    categories: [
      { slug: "tower-speakers", label: "Tower Speaker", icon: Speaker },
      { slug: "home-theatre-systems", label: "Home Theatre", icon: Home },
      { slug: "audio-amplifiers", label: "Amplifier", icon: Sliders },
      { slug: "bt-satellite-speakers", label: "BT / Satellite Speakers", icon: Bluetooth },
      { slug: "speaker-woofer", label: "Speaker / Woofer", icon: Volume2 },
    ],
  },
  {
    label: "Car Audio",
    categories: [
      { slug: "car-speaker", label: "Car Speaker", icon: Car },
      { slug: "car-tape", label: "Car Tape", icon: Disc3 },
    ],
  },
  {
    label: "Power & Connectivity",
    categories: [
      { slug: "power-strips", label: "Power Strips", icon: Plug },
      { slug: "adaptor", label: "Adaptor", icon: Zap },
      { slug: "cables", label: "Cables", icon: Cable },
      { slug: "dth", label: "DTH", icon: Satellite },
    ],
  },
  {
    label: "Tools & Appliances",
    categories: [
      { slug: "soldering-iron", label: "Soldering Iron", icon: Wrench },
      { slug: "led-dth-stands", label: "LED / DTH Stands", icon: Tv },
      { slug: "appliances", label: "Cooktop", icon: Refrigerator },
    ],
  },
];

/** Flat list of all categories (derived from groups) */
export const CATEGORIES: Category[] = CATEGORY_GROUPS.flatMap((g) => g.categories);

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

type FallbackCategorySlug = CategorySlug | "portable-speakers" | "car-audio" | "dth-receivers" | "tv-kits" | "stands-mounts" | "power-accessories";

const CATEGORY_FALLBACK_LABELS: Record<FallbackCategorySlug, string> = {
  "tower-speakers": "Tower Speaker",
  "home-theatre-systems": "Home Theatre",
  "audio-amplifiers": "Amplifier",
  "bt-satellite-speakers": "BT / Satellite Speakers",
  "speaker-woofer": "Speaker / Woofer",
  "car-speaker": "Car Speaker",
  "car-tape": "Car Tape",
  "power-strips": "Power Strips",
  "adaptor": "Adaptor",
  "cables": "Cables",
  "dth": "DTH",
  "soldering-iron": "Soldering Iron",
  "led-dth-stands": "LED / DTH Stands",
  "appliances": "Cooktop",
  // Legacy slugs for backward compat
  "portable-speakers": "Portable Speakers",
  "car-audio": "Car Audio",
  "dth-receivers": "DTH Receivers",
  "tv-kits": "TV Kits",
  "stands-mounts": "Stands & Mounts",
  "power-accessories": "Power Accessories",
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
