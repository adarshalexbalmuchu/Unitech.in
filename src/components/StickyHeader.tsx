import { useState } from "react";
import { Search, Menu, X, Heart, User } from "lucide-react";
import { Link } from "react-router-dom";
import CartSheet from "@/components/CartSheet";
import NotificationDropdown from "@/components/NotificationDropdown";
import SearchModal from "@/components/SearchModal";
import { CATEGORIES } from "@/lib/constants";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";

const StickyHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { wishlistItems } = useWishlist();
  const { user } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 bg-background shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-2.5 md:py-3 flex items-center gap-3 md:gap-8">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden h-10 w-10 -ml-1 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="shrink-0">
            <img src={`${import.meta.env.BASE_URL}unitech-logo.png?v=2`} alt="Unitech India" className="h-7 sm:h-8 md:h-9 w-auto" />
          </Link>

          {/* Desktop search */}
          <div
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex flex-1 bg-surface rounded-lg overflow-hidden border border-transparent hover:border-primary/30 cursor-pointer transition-colors items-center px-4 py-3 gap-3"
          >
            <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm text-muted-foreground">Search for speakers, amplifiers, audio...</span>
          </div>

          {/* Mobile search */}
          <div className="flex-1 md:hidden" onClick={() => setSearchOpen(true)}>
            <div className="flex bg-surface rounded-lg overflow-hidden border border-transparent items-center px-3 py-2 gap-2 cursor-pointer">
              <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-sm text-muted-foreground">Search...</span>
            </div>
          </div>

          <div className="flex gap-0.5 shrink-0">
            {/* Wishlist */}
            <Link to="/wishlist" className="h-10 w-10 rounded-full hover:bg-surface transition-colors relative inline-flex items-center justify-center" aria-label="Wishlist">
              <Heart className="w-5 h-5 text-muted-foreground hover:text-primary" strokeWidth={1.5} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            <CartSheet />
            {/* Account */}
            <Link to={user ? "/account" : "/login"} className="h-10 w-10 rounded-full hover:bg-surface transition-colors inline-flex items-center justify-center" aria-label="Account">
              <User className="w-5 h-5 text-muted-foreground hover:text-primary" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
          <nav className="relative bg-background w-64 max-w-[85vw] h-full shadow-xl overflow-y-auto pt-[56px]">
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
              <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground">
                Wishlist ({wishlistItems.length})
              </Link>
              <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground">
                My Account
              </Link>
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
