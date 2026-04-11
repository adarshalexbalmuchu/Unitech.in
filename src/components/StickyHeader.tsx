import { useState, useRef, useEffect } from "react";
import { Search, Menu, X, Heart, User, ChevronRight, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import CartSheet from "@/components/CartSheet";
import SearchModal from "@/components/SearchModal";
import { CATEGORIES, CATEGORY_GROUPS } from "@/lib/constants";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

/* ── Per-group nav dropdown ────────────────────────── */

import type { CategoryGroup } from "@/lib/constants";

const GroupDropdown = ({ group }: { group: CategoryGroup }) => {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const isGroupActive = group.categories.some(
    (cat) => location.pathname === `/products/${cat.slug}`
  );

  const useGrid = group.categories.length > 2;

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-0.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors whitespace-nowrap ${
          isGroupActive
            ? "text-[#e8251a]"
            : open
              ? "text-[#e8251a]"
              : "text-muted-foreground hover:text-[#e8251a]"
        }`}
      >
        {group.label}
        <ChevronDown
          className={`w-2.5 h-2.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-px pt-1 z-50"
          style={{ minWidth: useGrid ? 380 : 240 }}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-border/60 p-3"
            style={{ animation: "fadeInDown 120ms ease-out" }}
          >
            <div className={useGrid ? "grid grid-cols-2 gap-1" : "flex flex-col gap-0.5"}>
              {group.categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = location.pathname === `/products/${cat.slug}`;
                return (
                  <Link
                    key={cat.slug}
                    to={`/products/${cat.slug}`}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-[#e8251a]/5 text-[#e8251a] font-semibold"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        isActive ? "bg-[#e8251a]/10 text-[#e8251a]" : "bg-muted text-foreground/60"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </span>
                    <span className="font-medium">{cat.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StickyHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { wishlistItems } = useWishlist();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const location = useLocation();

  // Track scroll for shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white border-b border-border transition-shadow duration-200 ${
          scrolled ? "shadow-[0_2px_8px_rgba(0,0,0,0.06)]" : ""
        }`}
      >
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
            className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 border border-transparent hover:border-border cursor-pointer transition-all"
            style={{ flex: "1 1 0", maxWidth: 600, minWidth: 320 }}
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

        {/* ── Row 2: Desktop category nav ── */}
        <nav className="hidden lg:block border-t border-border/60">
          <div className="max-w-[1280px] mx-auto px-6 flex items-center h-9">
            <Link
              to="/products/all"
              className={`shrink-0 text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap pr-3 ${
                location.pathname === "/products/all"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Products
            </Link>
            <span className="w-px h-3.5 bg-border shrink-0" />

            {/* Group dropdowns */}
            <div className="flex items-center flex-1 justify-center gap-1">
              {CATEGORY_GROUPS.map((group) => (
                <GroupDropdown key={group.label} group={group} />
              ))}
            </div>

            <span className="w-px h-3.5 bg-border shrink-0" />
            <Link
              to="/wholesale"
              className={`shrink-0 text-[11px] font-semibold tracking-wide transition-colors whitespace-nowrap pl-3 ${
                location.pathname.startsWith("/wholesale")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Partner With Us
            </Link>
          </div>
        </nav>

        {/* Shared dropdown animation */}
        <style>{`
          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </header>

      {/* ── Category bar (mobile — pill style with group labels) ── */}
      <nav className="lg:hidden sticky top-14 z-[39] bg-white border-b border-border">
        <div className="flex flex-row items-center gap-1.5 px-4 py-2 overflow-x-auto scrollbar-none">
          <Link
            to="/products/all"
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border ${
              location.pathname === "/products/all"
                ? "bg-primary text-white border-primary"
                : "bg-background text-muted-foreground border-border"
            }`}
          >
            All
          </Link>
          {CATEGORY_GROUPS.map((group) => (
            group.categories.map((cat) => {
              const isActive = location.pathname === `/products/${cat.slug}`;
              return (
                <Link
                  key={cat.slug}
                  to={`/products/${cat.slug}`}
                  className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border ${
                    isActive
                      ? "bg-primary text-white border-primary"
                      : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })
          ))}
        </div>
      </nav>

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
              <Link
                to="/products/all"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors mb-2"
              >
                All Products
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
              {CATEGORY_GROUPS.map((group) => (
                <div key={group.label} className="mb-3">
                  <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {group.label}
                  </p>
                  {group.categories.map((cat) => {
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
              ))}
            </div>

            {/* Partner link */}
            <div className="px-3 pb-2">
              <Link
                to="/wholesale"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
              >
                Partner With Us
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
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
