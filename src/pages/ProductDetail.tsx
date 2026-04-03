import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, Minus, Plus } from "lucide-react";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { formatPrice, CATEGORIES, getCategoryFallbackImage, resolveProductGalleryImages } from "@/lib/constants";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

type ProductReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
};

const formatSpecValue = (value: unknown) => {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

const SPEC_KEY_OVERRIDES: Record<string, string> = {
  rgb: "RGB", dth: "DTH", hdmi: "HDMI", usb: "USB", led: "LED",
  ir: "IR", mpeg4: "MPEG4", mp3: "MP3", rms: "RMS", aac: "AAC",
  ac: "AC", dc: "DC", lcd: "LCD", av: "AV", fm: "FM", sd: "SD",
  hd: "HD", uhd: "UHD", wifi: "Wi-Fi", bluetooth: "Bluetooth",
};

const formatSpecLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => SPEC_KEY_OVERRIDES[w.toLowerCase()] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => Boolean(item));
};

const normalizeFaqs = (value: unknown): Array<{ question: string; answer: string }> => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const maybeFaq = item as { question?: unknown; answer?: unknown; q?: unknown; a?: unknown };
      const question =
        (typeof maybeFaq.question === "string" && maybeFaq.question.trim()) ||
        (typeof maybeFaq.q === "string" && maybeFaq.q.trim()) ||
        "";
      const answer =
        (typeof maybeFaq.answer === "string" && maybeFaq.answer.trim()) ||
        (typeof maybeFaq.a === "string" && maybeFaq.a.trim()) ||
        "";
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is { question: string; answer: string } => Boolean(item));
};

const toDescriptionParagraphs = (description: string): string[] => {
  const cleaned = description.trim();
  if (!cleaned) return [];

  if (/\n\s*\n/.test(cleaned)) {
    return cleaned
      .split(/\n\s*\n/g)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentences.length <= 2) return [cleaned];

  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(" "));
  }

  return paragraphs;
};

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: allProducts = [], isLoading, isError, error, refetch } = useProducts();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewComment, setReviewComment] = useState("");

  const product = useMemo(() => allProducts.find((p) => p.slug === slug), [allProducts, slug]);

  const related = useMemo(() => {
    if (!product) return [];
    return allProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  }, [allProducts, product]);

  const reviewsStorageKey = useMemo(() => (slug ? `product-reviews:${slug}` : ""), [slug]);

  useEffect(() => {
    if (!reviewsStorageKey) return;
    try {
      const raw = localStorage.getItem(reviewsStorageKey);
      if (!raw) {
        setReviews([]);
        return;
      }
      const parsed = JSON.parse(raw);
      setReviews(Array.isArray(parsed) ? parsed : []);
    } catch {
      setReviews([]);
    }
  }, [reviewsStorageKey]);

  useEffect(() => {
    if (!reviewsStorageKey) return;
    localStorage.setItem(reviewsStorageKey, JSON.stringify(reviews));
  }, [reviews, reviewsStorageKey]);

  useEffect(() => {
    if (!user) return;
    const defaultName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "";
    setReviewerName((prev) => (prev.trim().length ? prev : defaultName));
  }, [user]);

  useEffect(() => {
    if (!product) return;
    const meta = document.querySelector('meta[name="description"]');
    if (!meta) return;

    const previous = meta.getAttribute("content") || "";
    if (product.seo_meta_description?.trim()) {
      meta.setAttribute("content", product.seo_meta_description.trim());
    }

    return () => {
      meta.setAttribute("content", previous);
    };
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <StickyHeader />
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 animate-pulse">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <StickyHeader />
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-20 text-center space-y-3">
          <h1 className="text-2xl font-bold text-destructive">Unable to load product</h1>
          <p className="text-sm text-muted-foreground">{getErrorMessage(error)}</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Retry
          </button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <StickyHeader />
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Link to="/products/all" className="text-primary font-semibold hover:underline">Browse All Products</Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const catMeta = CATEGORIES.find((c) => c.slug === product.category);
  const catLabel = catMeta?.label ?? product.category;
  const wishlisted = isInWishlist(product.id);
  const inStock = product.stock > 0;
  const fallbackImage = getCategoryFallbackImage(product.category);
  const images = resolveProductGalleryImages(product.images, product.image_url, product.category);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addToCart(product.id, { name: product.name, price: product.price ?? 0, image_url: product.image_url });
    }
    toast.success(`Added ${qty} item${qty > 1 ? "s" : ""} to cart`, { description: product.name });
  };

  const handleWishlist = () => {
    const wasWishlisted = wishlisted;
    toggleWishlist(product.id, {
      name: product.name,
      price: product.price,
      original_price: product.original_price,
      image_url: product.image_url,
    });
    toast(wasWishlisted ? "Removed from wishlist" : "Added to wishlist", { description: product.name });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch {
        return;
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const specEntries = Object.entries(product.specs || {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );

  const specHighlights = (() => {
    const priorityKeys = [
      "power_output",
      "rms_power",
      "peak_power",
      "speaker_size",
      "frequency_response",
      "impedance",
      "connectivity",
      "bluetooth",
      "battery_life",
      "warranty",
    ];

    const picked: string[] = [];
    const used = new Set<string>();

    priorityKeys.forEach((key) => {
      const found = specEntries.find(([specKey]) => specKey.toLowerCase() === key);
      if (found && picked.length < 5) {
        const [specKey, specValue] = found;
        picked.push(`${formatSpecLabel(specKey)}: ${formatSpecValue(specValue)}`);
        used.add(specKey);
      }
    });

    specEntries.forEach(([specKey, specValue]) => {
      if (picked.length >= 5 || used.has(specKey)) return;
      picked.push(`${formatSpecLabel(specKey)}: ${formatSpecValue(specValue)}`);
      used.add(specKey);
    });

    return picked.slice(0, 5);
  })();

  const structuredHighlights = normalizeStringList(product.highlights).slice(0, 5);
  const displayHighlights = structuredHighlights.length > 0 ? structuredHighlights : specHighlights;
  const perfectForItems = normalizeStringList(product.perfect_for);
  const faqItems = normalizeFaqs(product.faqs);
  const shortTagline = (product.short_tagline || "").trim();
  const descriptionParagraphs = toDescriptionParagraphs(product.description || "");

  const totalCount = product.reviews_count + reviews.length;
  const baseTotal = product.rating * product.reviews_count;
  const newTotal = reviews.reduce((sum, item) => sum + item.rating, 0);
  const displayedRating = totalCount > 0 ? Math.round(((baseTotal + newTotal) / totalCount) * 10) / 10 : 0;

  const displayedReviewsCount = product.reviews_count + reviews.length;

  const handleSubmitReview = () => {
    const name = reviewerName.trim();
    const comment = reviewComment.trim();

    if (!selectedRating) {
      toast.error("Please select a rating");
      return;
    }
    if (!name) {
      toast.error("Please enter your name");
      return;
    }
    if (!comment) {
      toast.error("Please write your review");
      return;
    }

    const newReview: ProductReview = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      rating: selectedRating,
      comment,
      created_at: new Date().toISOString(),
    };

    setReviews((prev) => [newReview, ...prev]);
    setSelectedRating(0);
    setHoverRating(0);
    setReviewComment("");
    toast.success("Review submitted");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StickyHeader />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-12 md:pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] md:text-xs text-muted-foreground mb-4 md:mb-6 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products/all" className="hover:text-foreground transition-colors">Products</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/products/${product.category}`} className="hover:text-foreground transition-colors">{catLabel}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* Main content */}
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-5 lg:gap-7 xl:gap-10 items-start">
          {/* Left — Image gallery */}
          <div className="relative xl:sticky xl:top-24 self-start">

            <ProductImageGallery images={images} alt={product.name} fallbackImage={fallbackImage} />
            <p style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', marginTop: 8, lineHeight: 1.4 }}>
              *Product images are indicative and may differ from the actual product.
            </p>
          </div>

          {/* Right — Product info */}
          <div className="space-y-4 md:space-y-5 lg:space-y-6">
            {/* Category + Brand */}
            <div className="flex items-center gap-2">
              <Link
                to={`/products/${product.category}`}
                style={{ fontSize: 11, fontWeight: 600, color: '#e8251a', background: 'rgba(232,37,26,0.08)', padding: '2px 10px', borderRadius: 4 }}
                className="hover:opacity-80 transition-opacity"
              >
                {catLabel}
              </Link>
              {product.brand && (
                <span className="text-xs font-medium text-muted-foreground">{product.brand}</span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-[32px] font-extrabold leading-tight">{product.name}</h1>

            {shortTagline && (
              <p className="text-sm md:text-base text-muted-foreground font-medium">{shortTagline}</p>
            )}

            {/* Model */}
            {product.model_number && (
              <p className="text-xs md:text-sm text-muted-foreground">
                Model: <span className="font-medium text-foreground">{product.model_number}</span>
                {product.sku && <span className="ml-3">SKU: {product.sku}</span>}
              </p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 ${i < Math.round(displayedRating) ? "fill-amber-400 text-amber-400" : "text-border"}`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold">{displayedRating.toFixed(1)}</span>
              <span className="text-xs md:text-sm text-muted-foreground">({displayedReviewsCount} reviews)</span>
            </div>

            {/* Price block */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2 md:gap-3 flex-wrap">
                <span style={{ color: '#e8251a' }} className="text-[28px] font-extrabold tabular-nums">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.original_price > (product.price ?? 0) && (
                  <span className="text-base md:text-lg line-through text-muted-foreground tabular-nums">
                    {formatPrice(product.original_price)}
                  </span>
                )}

              </div>
              <p className="text-[11px] md:text-xs text-muted-foreground">Inclusive of all taxes. Shipping calculated at checkout.</p>
              <Link
                to="/wholesale"
                className="inline-block text-xs text-primary font-medium mt-1 hover:underline transition-all"
              >
                Buying in bulk? View wholesale pricing →
              </Link>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%' }} className={inStock ? "bg-green-500" : "bg-destructive"} />
              <span className={`text-sm font-medium ${inStock ? "text-green-600" : "text-destructive"}`}>
                {inStock ? (product.stock <= 10 ? `Only ${product.stock} left in stock` : "In Stock") : "Out of Stock"}
              </span>
            </div>

            {/* Description */}
            {descriptionParagraphs.length > 0 && (
              <div className="space-y-2">
                {descriptionParagraphs.map((paragraph, idx) => (
                  <p key={`${paragraph.slice(0, 32)}-${idx}`} className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {displayHighlights.length > 0 && (
              <div className="space-y-2.5">
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>Key Highlights</h3>
                <div className="flex flex-wrap gap-2">
                  {displayHighlights.map((highlight, idx) => (
                    <span
                      key={`${highlight}-${idx}`}
                      style={{ background: '#f5f5f5', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 20, padding: '4px 12px', fontSize: 12 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e8251a', flexShrink: 0 }} />
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + CTA — stacked on mobile */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }} className="flex items-center self-start">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2.5 hover:bg-muted transition-colors rounded-l-lg"
                  disabled={qty <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2.5 text-sm font-bold tabular-nums min-w-[44px] text-center border-x border-border">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="px-3 py-2.5 hover:bg-muted transition-colors rounded-r-lg"
                  disabled={qty >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  style={{ background: '#e8251a', color: '#fff', borderRadius: 8, padding: '14px 0', fontSize: 14, fontWeight: 700 }}
                  className="flex-1 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>

                <div className="flex gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleWishlist}
                    className={`p-3 rounded-lg border transition-colors ${
                      wishlisted ? "bg-destructive/10 border-destructive/30 text-destructive" : "border-border hover:bg-muted"
                    }`}
                    aria-label="Toggle wishlist"
                  >
                    <Heart className={`w-5 h-5 ${wishlisted ? "fill-current" : ""}`} />
                  </button>

                  <button onClick={handleShare} className="p-3 rounded-lg border border-border hover:bg-muted transition-colors" aria-label="Share">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '14px 0' }} className="flex flex-row items-center justify-around gap-2">
              <div className="flex flex-row items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                <span>Free Shipping</span>
              </div>
              <div className="flex flex-row items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                <span>1 Year Warranty</span>
              </div>
              <div className="flex flex-row items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                <span>Exchange Offer</span>
              </div>
            </div>

            {perfectForItems.length > 0 && (
              <section className="pt-2">
                <h3 className="text-sm font-semibold mb-2">Perfect For</h3>
                <ul className="space-y-1.5 text-xs md:text-sm text-muted-foreground">
                  {perfectForItems.map((item, idx) => (
                    <li key={`${item}-${idx}`} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {/* Specs table */}
        <section className="mt-10 md:mt-14">
          <div style={{ width: 20, height: 2, background: '#e8251a', marginBottom: 10 }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Specifications</h2>

          {specEntries.length > 0 ? (
            <div style={{ borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[320px]">
                  <tbody>
                    {specEntries.map(([key, value], i) => (
                      <tr key={key} style={{ background: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <td className="w-[120px] md:w-[200px]" style={{ padding: '10px 12px', fontWeight: 600, color: '#666', whiteSpace: 'nowrap', fontSize: 13 }}>
                          {formatSpecLabel(key)}
                        </td>
                        <td style={{ padding: '10px 20px', fontSize: 13 }}>
                          {formatSpecValue(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border p-4 md:p-5 space-y-3">
              <p className="text-sm md:text-base font-semibold text-foreground">Specifications coming soon</p>
              <p className="text-xs md:text-sm text-muted-foreground">
                We are updating technical details for this product. You can still use the key product information below.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                <div className="rounded-md bg-surface px-3 py-2">
                  <p className="text-[11px] md:text-xs text-muted-foreground">Category</p>
                  <p className="text-xs md:text-sm font-semibold">{catLabel}</p>
                </div>
                {product.brand && (
                  <div className="rounded-md bg-surface px-3 py-2">
                    <p className="text-[11px] md:text-xs text-muted-foreground">Brand</p>
                    <p className="text-xs md:text-sm font-semibold">{product.brand}</p>
                  </div>
                )}
                {product.model_number && (
                  <div className="rounded-md bg-surface px-3 py-2">
                    <p className="text-[11px] md:text-xs text-muted-foreground">Model Number</p>
                    <p className="text-xs md:text-sm font-semibold">{product.model_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {faqItems.length > 0 && (
          <section className="mt-10 md:mt-14">
            <div style={{ width: 20, height: 2, background: '#e8251a', marginBottom: 10 }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>FAQs</h2>
            <div className="faq-accordion" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '0 16px' }}>
              <Accordion type="single" collapsible>
                {faqItems.map((faq, idx) => (
                  <AccordionItem key={`${faq.question}-${idx}`} value={`faq-${idx}`}>
                    <AccordionTrigger className="text-left text-sm md:text-base">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}

        <section className="mt-10 md:mt-14">
          <div style={{ width: 20, height: 2, background: '#e8251a', marginBottom: 10 }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Ratings & Reviews</h2>

          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: 20 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 36, fontWeight: 800 }} className="tabular-nums">{displayedRating.toFixed(1)}</span>
                <div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.round(displayedRating) ? "fill-amber-400 text-amber-400" : "text-border"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Based on {displayedReviewsCount} reviews</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">Your Rating</label>
                <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const value = i + 1;
                    const active = value <= (hoverRating || selectedRating);
                    return (
                      <button
                        type="button"
                        key={value}
                        onMouseEnter={() => setHoverRating(value)}
                        onClick={() => setSelectedRating(value)}
                        className="p-0.5"
                        aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                      >
                        <Star className={`w-6 h-6 vm-transition ${active ? "fill-amber-400 text-amber-400" : "text-border hover:text-amber-300"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reviewer-name" className="text-sm font-semibold">Your Name</label>
                <input
                  id="reviewer-name"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="review-comment" className="text-sm font-semibold">Your Review</label>
                <Textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Write your experience with this product"
                  className="min-h-[110px]"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmitReview}
                style={{ background: '#e8251a', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700 }}
                className="w-full md:w-auto hover:opacity-90 transition-opacity"
              >
                Submit Review
              </button>
            </div>

            <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: 20 }}>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {product.reviews_count > 0
                    ? "Reviews from verified purchases. Sign in to add yours."
                    : "No customer reviews yet. Be the first to review this product."}
                </p>
              ) : (
                <div className="space-y-4 max-h-[420px] overflow-auto pr-1">
                  {reviews.map((review) => (
                    <article key={review.id} className="pb-4 border-b border-border last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{review.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-foreground/90 mt-2 leading-relaxed">{review.comment}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-10 md:mt-14">
            <div style={{ width: 20, height: 2, background: '#e8251a', marginBottom: 10 }} />
            <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Related Products</h2>
              <Link
                to={`/products/${product.category}`}
                style={{ color: '#e8251a', fontSize: 14, fontWeight: 600 }}
                className="hover:underline"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};

export default ProductDetail;
