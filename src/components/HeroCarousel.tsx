import { useState, useEffect, useCallback } from "react";

const banners = [
  { id: 1, src: "/banners/banner1.jpg" },
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback(
    (index: number) => setCurrent((index + banners.length) % banners.length),
    []
  );

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => goTo(current + 1), 4000);
    return () => clearInterval(timer);
  }, [current, goTo]);

  return (
    <section className="max-w-[1280px] mx-auto px-6 py-6">
      <div className="relative rounded-xl overflow-hidden" style={{ height: "clamp(320px, 45vw, 460px)" }}>
        <div
          className="flex h-full transition-transform duration-700 ease-in-out will-change-transform"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((banner) => (
            <div key={banner.id} className="relative w-full h-full flex-shrink-0">
              <img
                src={banner.src}
                alt={`Unitech Banner ${banner.id}`}
                className="w-full h-full object-cover object-center"
              />
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to banner ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-8 h-2.5 bg-background"
                    : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroCarousel;
