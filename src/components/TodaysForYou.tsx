import { useState } from "react";
import { Heart, Speaker } from "lucide-react";
import { formatPrice } from "@/lib/constants";

const tabs = ["Best Seller", "New Arrivals", "Special Discount", "Top Rated"];

const products = [
  { id: 1, name: "5.1 Tower Speaker System – Deep Bass", rating: 4.8, sold: "12k+", price: 24999, oldPrice: 34999 },
  { id: 2, name: "Home Theatre Dolby Atmos Surround", rating: 4.7, sold: "8k+", price: 18999, oldPrice: 27999 },
  { id: 3, name: "Car Stereo System – Bluetooth 5.0", rating: 4.6, sold: "5k+", price: 4999, oldPrice: 6999 },
  { id: 4, name: "DTH Set Top Box – Free-to-Air HD", rating: 4.5, sold: "20k+", price: 1999, oldPrice: 2999 },
  { id: 5, name: "Audio Amplifier 500W – Pro Grade", rating: 4.9, sold: "3k+", price: 7999, oldPrice: 11999 },
  { id: 6, name: "Portable Bluetooth Speaker 20hr", rating: 4.4, sold: "15k+", price: 2499, oldPrice: 3999 },
  { id: 7, name: "Multimedia 2.1 Desktop Speakers", rating: 4.3, sold: "7k+", price: 3499, oldPrice: 4999 },
  { id: 8, name: "Karaoke System – Wireless Mic Set", rating: 4.6, sold: "4k+", price: 5999, oldPrice: 8999 },
];

const TodaysForYou = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="max-w-[1280px] mx-auto px-6 py-16">
      <div className="flex border-b border-border mb-8 overflow-x-auto scrollbar-none">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActive(i)}
            className={`px-8 py-4 text-base font-semibold whitespace-nowrap relative vm-transition ${
              i === active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {tab}
            {i === active && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <article
            key={p.id}
            className="bg-card rounded-lg vm-shadow p-3 flex flex-col gap-3 vm-transition vm-card-hover relative cursor-pointer outline outline-1 outline-border -outline-offset-1 hover:outline-transparent"
          >
            <button className="absolute top-5 right-5 bg-background w-8 h-8 rounded-full flex justify-center items-center shadow-md z-10 vm-transition hover:text-destructive hover:scale-110">
              <Heart className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <div className="w-full aspect-square bg-surface rounded flex justify-center items-center">
              <Speaker className="w-10 h-10 text-muted-foreground/40" strokeWidth={1} />
            </div>
            <h3 className="text-sm font-medium leading-snug line-clamp-2">{p.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-amber-500">★</span> {p.rating} • {p.sold} Sold
            </div>
            <div className="flex items-baseline gap-2 tabular-nums mt-auto">
              <span className="text-lg font-extrabold text-primary">{formatPrice(p.price)}</span>
              {p.oldPrice && <span className="text-xs line-through text-muted-foreground">{formatPrice(p.oldPrice)}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TodaysForYou;
