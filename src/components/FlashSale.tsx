import { useState, useEffect } from "react";
import { Speaker } from "lucide-react";
import { formatPrice } from "@/lib/constants";

const flashProducts = [
  { name: "5.1 Tower Speaker System – 1200W", discount: 40, price: 14999, old: 24999, rating: 4.9, sold: "12k+", progress: 85 },
  { name: "Home Theatre System – Dolby Atmos", discount: 25, price: 18999, old: 27999, rating: 4.7, sold: "8k+", progress: 40 },
  { name: "Car Stereo – Bluetooth 5.0", discount: 30, price: 4999, old: 6999, rating: 4.8, sold: "5k+", progress: 95 },
  { name: "DTH Set Top Box – HD Ready", discount: 50, price: 1499, old: 2999, rating: 4.9, sold: "20k+", progress: 60 },
  { name: "Audio Amplifier – 500W RMS", discount: 35, price: 7799, old: 11999, rating: 4.6, sold: "3k+", progress: 20 },
];

const FlashSale = () => {
  const [time, setTime] = useState(2 * 3600 + 45 * 60 + 30);

  useEffect(() => {
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(Math.floor(time / 3600)).padStart(2, "0");
  const m = String(Math.floor((time % 3600) / 60)).padStart(2, "0");
  const s = String(time % 60).padStart(2, "0");

  return (
    <section className="py-12 bg-secondary/50">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex items-center gap-6 mb-6">
          <h2 className="text-2xl font-extrabold flex items-center gap-2">⚡ Flash Sale</h2>
          <div className="flex gap-1.5 items-center tabular-nums">
            <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-sm font-bold">{h}</span>
            <span className="text-destructive font-bold">:</span>
            <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-sm font-bold">{m}</span>
            <span className="text-destructive font-bold">:</span>
            <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-sm font-bold">{s}</span>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory p-1 -m-1">
          {flashProducts.map((p) => (
            <article
              key={p.name}
              className="flex-shrink-0 w-[200px] md:w-[calc(20%-13px)] min-w-[200px] bg-card rounded-lg vm-shadow p-3 flex flex-col gap-3 vm-transition vm-card-hover relative cursor-pointer outline outline-1 outline-border -outline-offset-1 hover:outline-transparent snap-start"
            >
              <span className="absolute top-5 left-5 bg-destructive text-destructive-foreground text-[0.625rem] font-extrabold px-2 py-1 rounded uppercase">
                -{p.discount}%
              </span>
              <div className="w-full aspect-square bg-surface rounded flex justify-center items-center">
                <Speaker className="w-10 h-10 text-muted-foreground/40" strokeWidth={1} />
              </div>
              <h3 className="text-sm font-medium leading-snug line-clamp-2">{p.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-amber-500">★</span> {p.rating} • {p.sold} Sold
              </div>
              <div className="flex items-baseline gap-2 tabular-nums mt-auto">
                <span className="text-lg font-extrabold text-primary">{formatPrice(p.price)}</span>
                <span className="text-xs line-through text-muted-foreground">{formatPrice(p.old)}</span>
              </div>
              <div>
                <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-destructive rounded-full" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="text-[0.625rem] text-muted-foreground mt-1 font-semibold">{p.progress}/100 Sold</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlashSale;
