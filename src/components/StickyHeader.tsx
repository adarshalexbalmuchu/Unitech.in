import { useState } from "react";
import { Search, Menu, X, Heart, User, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import CartSheet from "@/components/CartSheet";
import SearchModal from "@/components/SearchModal";
import { CATEGORIES } from "@/lib/constants";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const StickyHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { wishlistItems } = useWishlist();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const location = useLocation();

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        {/* ── Main row ── */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center gap-3 md:gap-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden h-9 w-9 -ml-1 inline-flex items-center justify-center rounded-md text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link to="/" className="shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}unitech-logo.png?v=2`}
              alt="Unitech India"
              className="h-7 md:h-8 w-auto"
            />
          </Link>

          {/* Desktop search */}
          <div
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex flex-1 items-center gap-3 px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 border border-transparent hover:border-border cursor-pointer transition-all"
          >
            <Search className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <span className="text-sm text-muted-foreground">Search speakers, amplifiers, home theatre…</span>
          </div>

          {/* Mobile search */}
          <div className="flex-1 md:hidden" onClick={() => setSearchOpen(true)}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-transparent cursor-pointer">
              <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-sm text-muted-foreground">Search…</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-[18px] h-[18px]" strokeWidth={1.75} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            <CartSheet />

            {/* Account */}
            <Link
              to={user ? "/account" : "/login"}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Account"
            >
              <User className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        {/* ── Category nav bar (desktop) ── */}
        <nav className="hidden md:block border-t border-border/60">
          <div className="max-w-[1280px] mx-auto px-6 flex items-center gap-6 h-9 overflow-x-auto scrollbar-none">
            <Link
              to="/products/all"
              className={`shrink-0 text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                location.pathname === "/products/all"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Products
            </Link>
            <span className="w-px h-3 bg-border shrink-0" />
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/products/${cat.slug}`}
                className={`shrink-0 text-[11px] font-semibold tracking-wide transition-colors whitespace-nowrap ${
                  location.pathname === `/products/${cat.slug}`
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* ── Search Modal ── */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ── Mobile navigation drawer ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav className="relative bg-white w-72 max-w-[88vw] h-full shadow-2xl overflow-y-auto flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <img
                src={`${import.meta.env.BASE_URL}unitech-logo.png?v=2`}
                alt="Unitech India"
                className="h-6 w-auto"
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Categories */}
            <div className="px-3 py-4 flex-1">
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Shop by Category
              </p>
              <Link
                to="/products/all"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors mb-1"
              >
                All Products
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.slug}
                    to={`/products/${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Icon className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
                    {cat.label}
                  </Link>
                );
              })}
            </div>

            {/* Account section */}
            <div className="border-t border-border px-3 py-4 space-y-1">
              {user ? (
                <>
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Account
                  </p>
                  <p className="px-3 py-1 text-xs text-muted-foreground truncate">{user.email}</p>
                  {isAdmin && (
                    <Link
                      to="/admin/products"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2.5 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                  >
                    My Account
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                  >
                    Wishlist {wishlistItems.length > 0 && `(${wishlistItems.length})`}
                  </Link>
                  <button
                    onClick={() => { signOut(); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default StickyHeader;
