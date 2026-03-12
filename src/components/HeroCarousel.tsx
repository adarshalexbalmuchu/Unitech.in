import { useState, useEffect, useCallback } from "react";

const banners = [
  { id: 1, src: `${import.meta.env.BASE_URL}banners/banner1.jpg` },
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
    <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 md:py-6">
      <div className="relative rounded-xl overflow-hidden bg-muted">
        <div
          className="flex transition-transform duration-700 ease-in-out will-change-transform"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((banner) => (
            <div key={banner.id} className="relative w-full flex-shrink-0">
              <img
                src={banner.src}
                alt={`Unitech Banner ${banner.id}`}
                className="w-full h-auto block"
              />
            </div>
          ))}
        </div>

        {banners.length > 1 && (
          <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to banner ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 md:w-8 h-2 md:h-2.5 bg-background"
                    : "w-2 md:w-2.5 h-2 md:h-2.5 bg-white/40 hover:bg-white/70"
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
