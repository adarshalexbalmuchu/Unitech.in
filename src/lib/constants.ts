export const SITE_NAME = "Unitech India";
export const SITE_TAGLINE = "Expand Your Life";
export const SITE_DESCRIPTION = "Manufacturing premium audio equipment and electronics since 1999. Trusted by professionals across India.";

export const CATEGORIES = [
  { slug: "tower-speakers", label: "Tower Speakers", icon: "🔊" },
  { slug: "home-theatre-systems", label: "Home Theatre", icon: "🎬" },
  { slug: "car-stereo-systems", label: "Car Audio", icon: "🚗" },
  { slug: "dth-receivers", label: "DTH Receivers", icon: "📡" },
  { slug: "audio-amplifiers", label: "Amplifiers", icon: "🎛️" },
  { slug: "portable-speakers", label: "Portable Speakers", icon: "🔉" },
  { slug: "multimedia-speakers", label: "Multimedia", icon: "🖥️" },
  { slug: "karaoke-systems", label: "Karaoke", icon: "🎤" },
  { slug: "all", label: "All Products", icon: "🗂️" },
] as const;

export const CURRENCY_SYMBOL = "₹";

export const formatPrice = (price: number | null) => {
  if (price === null) return "Price on Request";
  return `${CURRENCY_SYMBOL}${price.toLocaleString("en-IN")}`;
};
