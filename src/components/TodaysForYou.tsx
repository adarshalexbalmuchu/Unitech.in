import { useState } from "react";

const tabs = ["Best Seller", "New Arrivals", "Special Discount", "Official Store"];

const products = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: `Premium Tech Gadget Model ${i + 1} - High Performance`,
  rating: (4 + Math.random() * 0.9).toFixed(1),
  sold: `${Math.floor(Math.random() * 10 + 1)}k+`,
  price: Math.floor(Math.random() * 500 + 50),
  oldPrice: i % 2 === 0 ? Math.floor(Math.random() * 200 + 600) : null,
}));

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
            <button className="absolute top-5 right-5 bg-background w-8 h-8 rounded-full flex justify-center items-center shadow-md text-base z-10 vm-transition hover:text-destructive hover:scale-110">
              ♡
            </button>
            <div className="w-full aspect-square bg-surface rounded flex justify-center items-center text-3xl text-vm-muted">📷</div>
            <h3 className="text-sm font-medium leading-snug line-clamp-2">{p.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-yellow-400">★</span> {p.rating} • {p.sold} Sold
            </div>
            <div className="flex items-baseline gap-2 tabular-nums mt-auto">
              <span className="text-lg font-extrabold text-primary">${p.price}</span>
              {p.oldPrice && <span className="text-xs line-through text-muted-foreground">${p.oldPrice}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TodaysForYou;
