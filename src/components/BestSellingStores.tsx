import { Speaker, Home, Car, Satellite } from "lucide-react";
import { formatPrice } from "@/lib/constants";

const stores = [
  { Icon: Speaker, name: "Unitech Audio", tagline: "Premium Speakers", prices: [24999, 7999, 3499] },
  { Icon: Home, name: "Unitech Theatre", tagline: "Home Cinema Systems", prices: [18999, 12999, 5999] },
  { Icon: Car, name: "Unitech Auto", tagline: "Car Audio Solutions", prices: [4999, 3499, 1999] },
  { Icon: Satellite, name: "Unitech Digital", tagline: "DTH & Set Top Box", prices: [1999, 1499, 999] },
];

const BestSellingStores = () => (
  <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-10 md:py-12 pb-16 md:pb-20">
    <h2 className="text-xl md:text-2xl font-extrabold mb-5 md:mb-6">Best Selling Categories</h2>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 md:gap-6">
      <div className="bg-gradient-to-br from-primary/5 to-primary/15 rounded-xl p-6 md:p-8 flex flex-col justify-center items-center text-center vm-shadow outline outline-1 outline-border -outline-offset-1">
        <img src={`${import.meta.env.BASE_URL}unitech-logo.png`} alt="Unitech India" className="h-10 md:h-12 mb-3 md:mb-4" />
        <h3 className="text-lg md:text-xl font-extrabold text-primary mb-1 md:mb-2">Unitech India</h3>
        <p className="text-xs md:text-sm text-primary/70 font-medium">Expand Your Life – Since 1999</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
        {stores.map((store) => (
          <div
            key={store.name}
            className="bg-card rounded-lg p-3 md:p-4 vm-shadow outline outline-1 outline-border -outline-offset-1 vm-transition vm-card-hover cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-surface rounded-full flex justify-center items-center">
                <store.Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="font-bold text-sm md:text-base">{store.name}</h4>
                <p className="text-[11px] md:text-xs text-muted-foreground">{store.tagline}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {store.prices.map((price, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="w-full aspect-square bg-surface rounded flex justify-center items-center">
                    <Speaker className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground/30" strokeWidth={1} />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-center tabular-nums">{formatPrice(price)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default BestSellingStores;
