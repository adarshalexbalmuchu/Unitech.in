const stores = [
  { icon: "🍎", name: "iTech Official", tagline: "Premium Devices", prices: [999, 249, 129] },
  { icon: "🎮", name: "GameZone", tagline: "Next-Gen Consoles", prices: [499, 69, 89] },
  { icon: "📸", name: "LensCrafters", tagline: "Pro Photography", prices: [1200, 450, 85] },
  { icon: "🎧", name: "SonicBass", tagline: "High-Fidelity Audio", prices: [349, 199, 59] },
];

const BestSellingStores = () => (
  <section className="max-w-[1280px] mx-auto px-6 py-12 pb-20">
    <h2 className="text-2xl font-extrabold mb-6">Best Selling Stores</h2>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 flex flex-col justify-center items-center text-center vm-shadow outline outline-1 outline-border -outline-offset-1">
        <div className="text-6xl mb-4">🛍️</div>
        <h3 className="text-2xl font-extrabold text-primary mb-2">VoltMart Mall</h3>
        <p className="text-sm text-blue-500 font-medium">100% Original & Guaranteed</p>
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
                  <div className="w-full aspect-square bg-surface rounded flex justify-center items-center text-base">📷</div>
                  <span className="text-xs font-bold text-center tabular-nums">${price}</span>
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
