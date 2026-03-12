import { useState } from "react";
import { X, Search } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-0 left-0 right-0 z-50 bg-background p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 bg-muted rounded-lg px-4 py-3">
              <Search className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for speakers, amplifiers, home theatre..."
                className="flex-1 bg-transparent outline-none text-sm"
                autoFocus
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          {!query && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Popular Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.slice(0, -1).map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.slug}
                      className="px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1.5"
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchModal;
