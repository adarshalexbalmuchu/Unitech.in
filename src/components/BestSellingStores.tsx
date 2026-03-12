const stores = [
  { icon: "🔊", name: "Unitech Audio", tagline: "Premium Speakers", prices: [24999, 7999, 3499] },
  { icon: "🎬", name: "Unitech Theatre", tagline: "Home Cinema Systems", prices: [18999, 12999, 5999] },
  { icon: "🚗", name: "Unitech Auto", tagline: "Car Audio Solutions", prices: [4999, 3499, 1999] },
  { icon: "📡", name: "Unitech Digital", tagline: "DTH & Set Top Box", prices: [1999, 1499, 999] },
];

const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

const BestSellingStores = () => (
  <section className="max-w-[1280px] mx-auto px-6 py-12 pb-20">
    <h2 className="text-2xl font-extrabold mb-6">Best Selling Categories</h2>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
      <div className="bg-gradient-to-br from-primary/5 to-primary/15 rounded-xl p-8 flex flex-col justify-center items-center text-center vm-shadow outline outline-1 outline-border -outline-offset-1">
        <img src="/unitech-logo.png" alt="Unitech India" className="h-12 mb-4" />
        <h3 className="text-xl font-extrabold text-primary mb-2">Unitech India</h3>
        <p className="text-sm text-primary/70 font-medium">Expand Your Life – Since 1999</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {stores.map((store) => (
          <div
            key={store.name}
            className="bg-card rounded-lg p-4 vm-shadow outline outline-1 outline-border -outline-offset-1 vm-transition vm-card-hover cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-surface rounded-full flex justify-center items-center text-xl">{store.icon}</div>
              <div>
                <h4 className="font-bold">{store.name}</h4>
                <p className="text-xs text-muted-foreground">{store.tagline}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {store.prices.map((price, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="w-full aspect-square bg-surface rounded flex justify-center items-center text-base">🔊</div>
                  <span className="text-xs font-bold text-center tabular-nums">{formatPrice(price)}</span>
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
