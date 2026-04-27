import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

export type ProductImageGalleryProps = {
  images: string[];
  alt: string;
  fallbackImage?: string;
};

const ProductImageGallery = ({ images, alt, fallbackImage }: ProductImageGalleryProps) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  // Desktop hover zoom
  const [zooming, setZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  // Remove fullscreen scroll zoom

  // Mobile touch tracking
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef(1);
  const lastTapTime = useRef(0);

  const safeImages = images.length > 0 ? images : [];
  const currentImage = safeImages[activeIdx];
  const safeFallback = fallbackImage || safeImages[0] || "";

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (safeFallback && event.currentTarget.src !== safeFallback) {
      event.currentTarget.src = safeFallback;
    }
  };

  const prev = useCallback(() => {
    setActiveIdx((i) => (i > 0 ? i - 1 : safeImages.length - 1));
  }, [safeImages.length]);

  const next = useCallback(() => {
    setActiveIdx((i) => (i < safeImages.length - 1 ? i + 1 : 0));
  }, [safeImages.length]);

  const openFullscreen = () => {
    setIsFullscreen(true);
    setFsZoom(1);
  };

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setFsZoom(1);
  }, []);

  // Keyboard navigation in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
      if (e.key === "ArrowLeft") { prev(); setFsZoom(1); }
      if (e.key === "ArrowRight") { next(); setFsZoom(1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen, prev, next, closeFullscreen]);

  // Lock body scroll in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isFullscreen]);

  // Desktop hover zoom — track cursor position as transform-origin
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
  };

  // Mobile touch — swipe, pinch, double-tap
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      // Double-tap to open fullscreen
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        openFullscreen();
      }
      lastTapTime.current = now;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartZoom.current = fsZoom;
    }
  }, [fsZoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newZoom = Math.min(4, Math.max(1, pinchStartZoom.current * (dist / pinchStartDist.current)));
      setFsZoom(newZoom);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.changedTouches.length === 1 && pinchStartDist.current === null) {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next();
        else prev();
      }
    }
    pinchStartDist.current = null;
  }, [prev, next]);

  // No scroll-to-zoom in fullscreen

  const handleImageLoad = (idx: number) => {
    setLoadedImages((prev) => new Set(prev).add(idx));
  };

  if (safeImages.length === 0) return null;

  return (
    <>
      {/* ── Gallery ── */}
      <div className="flex gap-2 md:gap-3">

        {/* Vertical thumbnail strip — desktop only */}
        {safeImages.length > 1 && (
          <div className="hidden md:flex flex-col gap-1.5 w-16 lg:w-[74px] shrink-0">
            {safeImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                onMouseEnter={() => setActiveIdx(i)}
                aria-label={`View image ${i + 1}`}
                className={`w-full aspect-square rounded-md overflow-hidden border vm-transition flex-shrink-0 bg-card ${
                  i === activeIdx
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <div className="relative w-full h-full bg-surface/70">
                  {!loadedImages.has(i) && (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/60 to-muted/30" />
                  )}
                  <img
                    src={img}
                    alt={`${alt} ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    sizes="72px"
                    className={`w-full h-full object-contain p-0.5 vm-transition ${
                      loadedImages.has(i) ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() => handleImageLoad(i)}
                    onError={handleImageError}
                  />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div className="flex-1 min-w-0">
          <div
            className="relative aspect-square bg-card rounded-xl vm-shadow overflow-hidden cursor-zoom-in group select-none border border-border/80"
            onMouseEnter={() => setZooming(true)}
            onMouseLeave={() => { setZooming(false); setZoomOrigin({ x: 50, y: 50 }); }}
            onMouseMove={handleMouseMove}
            onClick={openFullscreen}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
          >
            {/* Blur skeleton while loading */}
            {!loadedImages.has(activeIdx) && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/60 to-muted/30 z-10 rounded-xl" />
            )}

            <img
              key={activeIdx}
              src={currentImage}
              alt={alt}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 100vw, 60vw"
              draggable={false}
              className={`w-full h-full object-contain p-1 md:p-1.5 will-change-transform ${
                loadedImages.has(activeIdx) ? "opacity-100" : "opacity-0"
              }`}
              style={{
                transition: zooming
                  ? "transform 0.15s ease, opacity 0.3s ease"
                  : "transform 0.25s ease, opacity 0.3s ease",
                transform: zooming ? "scale(2)" : "scale(1)",
                transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
              }}
              onLoad={() => handleImageLoad(activeIdx)}
              onError={handleImageError}
            />

            {/* Zoom hint icon */}
            <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 vm-transition pointer-events-none">
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Mobile dot indicator */}
            {safeImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 md:hidden pointer-events-none">
                {safeImages.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full vm-transition ${
                      i === activeIdx ? "w-4 bg-primary" : "w-1.5 bg-foreground/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Mobile thumbnail row */}
          {safeImages.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none md:hidden">
              {safeImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`w-14 h-14 rounded-md overflow-hidden border flex-shrink-0 vm-transition bg-card ${
                    i === activeIdx
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <img src={img} alt="" loading="lazy" decoding="async" sizes="56px" className="w-full h-full object-contain p-1" onError={handleImageError} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Fullscreen overlay — rendered at body root via portal to escape stacking contexts ── */}
      {isFullscreen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Product image preview"
          style={{ overscrollBehavior: 'none', touchAction: 'none' }}
          onClick={closeFullscreen}
        >
          {/* Close button — positioned inside the overlay so it always stays above it */}
          <button
            className="absolute top-4 right-4 p-3 rounded-full bg-white/15 hover:bg-white/25 vm-transition text-white shadow-lg shadow-black/20 focus:outline-none focus:ring-2 focus:ring-white"
            style={{ zIndex: 1 }}
            onClick={(e) => { e.stopPropagation(); closeFullscreen(); }}
            aria-label="Close product image preview"
            tabIndex={0}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium tabular-nums pointer-events-none" style={{ zIndex: 1 }}>
            {activeIdx + 1} / {safeImages.length}
          </div>

          {/* Prev/next arrows */}
          {safeImages.length > 1 && (
            <button
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 vm-transition text-white focus:outline-none focus:ring-2 focus:ring-white"
              style={{ zIndex: 1 }}
              onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i > 0 ? i - 1 : safeImages.length - 1)); }}
              aria-label="Previous image"
              tabIndex={0}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {safeImages.length > 1 && (
            <button
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 vm-transition text-white focus:outline-none focus:ring-2 focus:ring-white"
              style={{ zIndex: 1 }}
              onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i < safeImages.length - 1 ? i + 1 : 0)); }}
              aria-label="Next image"
              tabIndex={0}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Centered image */}
          <div
            className="relative flex items-center justify-center w-full h-full"
            style={{ maxHeight: '100vh', maxWidth: '100vw' }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
          >
            <img
              src={currentImage}
              alt={alt}
              decoding="async"
              sizes="90vw"
              className="max-w-[90vw] max-h-[85vh] object-contain select-none"
              style={{ transition: "transform 0.2s ease", cursor: "default" }}
              draggable={false}
              onError={handleImageError}
            />
          </div>

          {/* Thumbnail strip */}
          {safeImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-xl backdrop-blur-sm max-w-[90vw] overflow-x-auto scrollbar-none" style={{ zIndex: 1 }}>
              {safeImages.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
                  className={`w-12 h-12 rounded-md overflow-hidden border-2 flex-shrink-0 vm-transition ${
                    i === activeIdx ? "border-white" : "border-white/20 hover:border-white/50"
                  }`}
                  tabIndex={0}
                >
                  <img src={img} alt="" loading="lazy" decoding="async" sizes="48px" className="w-full h-full object-contain p-0.5" onError={handleImageError} />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default ProductImageGallery;
