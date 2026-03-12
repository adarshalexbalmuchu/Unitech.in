const StickyHeader = () => (
  <header className="sticky top-0 z-50 bg-background shadow-[0_1px_2px_rgba(0,0,0,0.06)] py-4">
    <div className="max-w-[1280px] mx-auto px-6 flex items-center gap-4 md:gap-8">
      <a href="#" className="text-2xl font-extrabold text-primary tracking-[-0.04em] shrink-0">VoltMart</a>
      <div className="flex-1 flex bg-surface rounded-lg overflow-hidden border border-transparent focus-within:border-primary focus-within:bg-background vm-transition">
        <select className="hidden md:block px-4 py-3 bg-transparent border-r border-border text-vm-muted text-sm outline-none">
          <option>All Categories</option>
          <option>Electronics</option>
        </select>
        <input
          type="text"
          className="flex-1 px-4 py-3 bg-transparent outline-none text-sm placeholder:text-vm-muted"
          placeholder="Search for laptops, phones, audio..."
        />
      </div>
      <div className="flex gap-5 text-xl shrink-0">
        <button className="hover:text-primary vm-transition hover:scale-105" aria-label="Cart">🛒</button>
        <button className="hover:text-primary vm-transition hover:scale-105" aria-label="Notifications">🔔</button>
      </div>
    </div>
  </header>
);

export default StickyHeader;
