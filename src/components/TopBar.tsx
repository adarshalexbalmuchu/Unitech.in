const TopBar = () => (
  <div className="bg-surface text-vm-muted text-xs font-medium py-2">
    <div className="max-w-[1280px] mx-auto px-6 flex justify-between items-center">
      <a href="#" className="hover:text-primary vm-transition">📱 Download App</a>
      <div className="hidden md:flex gap-6">
        <a href="#" className="hover:text-primary vm-transition">About VoltMart</a>
        <a href="#" className="hover:text-primary vm-transition">VoltMart Care</a>
        <a href="#" className="hover:text-primary vm-transition">Promo</a>
      </div>
      <div className="flex gap-3 items-center">
        <a href="#" className="hover:text-primary vm-transition">Sign Up</a>
        <span>|</span>
        <a href="#" className="hover:text-primary vm-transition">Login</a>
      </div>
    </div>
  </div>
);

export default TopBar;
