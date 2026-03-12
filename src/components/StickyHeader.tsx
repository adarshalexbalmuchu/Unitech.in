import { Search } from "lucide-react";
import CartSheet from "@/components/CartSheet";
import NotificationDropdown from "@/components/NotificationDropdown";

const StickyHeader = () => (
  <header className="sticky top-0 z-50 bg-background shadow-[0_1px_2px_rgba(0,0,0,0.06)] py-3">
    <div className="max-w-[1280px] mx-auto px-6 flex items-center gap-4 md:gap-8">
      <a href="/" className="shrink-0">
        <img src="/unitech-logo.png" alt="Unitech India" className="h-8 sm:h-9 w-auto" />
      </a>
      <div className="flex-1 flex bg-surface rounded-lg overflow-hidden border border-transparent focus-within:border-primary focus-within:bg-background vm-transition">
        <select className="hidden md:block px-4 py-3 bg-transparent border-r border-border text-vm-muted text-sm outline-none">
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
      <div className="flex gap-1 shrink-0">
        <CartSheet />
        <NotificationDropdown />
      </div>
    </div>
  </header>
);

export default StickyHeader;
