import { useState } from "react";
import { Search, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import CartSheet from "@/components/CartSheet";
import NotificationDropdown from "@/components/NotificationDropdown";
import { CATEGORIES } from "@/lib/constants";

const StickyHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-2.5 md:py-3 flex items-center gap-3 md:gap-8">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-1.5 -ml-1 text-muted-foreground hover:text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="shrink-0">
            <img src={`${import.meta.env.BASE_URL}unitech-logo.png`} alt="Unitech India" className="h-7 sm:h-8 md:h-9 w-auto" />
          </Link>

          {/* Desktop search */}
          <div className="hidden md:flex flex-1 bg-surface rounded-lg overflow-hidden border border-transparent focus-within:border-primary focus-within:bg-background vm-transition">
            <select className="px-4 py-3 bg-transparent border-r border-border text-vm-muted text-sm outline-none">
              <option>All Categories</option>
              <option>Tower Speakers</option>
              <option>Home Theatre</option>
              <option>Car Audio</option>
              <option>DTH Receivers</option>
              <option>Amplifiers</option>
            </select>
            <input
              type="text"
              className="flex-1 px-4 py-3 bg-transparent outline-none text-sm placeholder:text-vm-muted"
              placeholder="Search for speakers, amplifiers, audio..."
            />
            <button className="px-4 text-vm-muted hover:text-primary vm-transition">
              <Search className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Mobile search icon */}
          <div className="flex-1 md:hidden">
            <div className="flex bg-surface rounded-lg overflow-hidden border border-transparent focus-within:border-primary">
              <input
                type="text"
                className="flex-1 px-3 py-2 bg-transparent outline-none text-sm placeholder:text-vm-muted min-w-0"
                placeholder="Search..."
              />
              <button className="px-3 text-vm-muted hover:text-primary">
                <Search className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="flex gap-0.5 shrink-0">
            <CartSheet />
            <NotificationDropdown />
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[52px] z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
          <nav className="relative bg-background w-64 h-full shadow-xl overflow-y-auto">
            <div className="p-4 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-3">Categories</p>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.slug}
                    to={`/products/${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                    {cat.label}
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-border p-4 space-y-1">
              <a
                href="#footer"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  document.querySelector("footer")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
              >
                About Unitech
              </a>
              <a
                href="#footer"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  document.querySelector("footer")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Customer Care
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default StickyHeader;
