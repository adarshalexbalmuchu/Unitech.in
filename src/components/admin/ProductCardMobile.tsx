import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, ChevronDown, ChevronUp, Star, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES, formatPrice, isPlaceholderImage } from "@/lib/constants";

interface ProductCardMobileProps {
  product: {
    id: string;
    name: string;
    category: string;
    price: number | null;
    discounted_price?: number | null;
    stock: number;
    is_active: boolean;
    is_featured: boolean;
    image_url: string;
    model_number?: string;
    sku?: string;
    updated_at?: string;
  };
  onToggle: (id: string, field: "is_active" | "is_featured", value: boolean) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
  isDeleting: boolean;
}

const ProductCardMobile = ({ product, onToggle, onDelete, isToggling, isDeleting }: ProductCardMobileProps) => {
  const [expanded, setExpanded] = useState(false);
  const p = product;
  const categoryLabel = CATEGORIES.find((c) => c.slug === p.category)?.label || p.category;
  const showPlaceholder = isPlaceholderImage(p.image_url);

  return (
    <div className={`rounded-xl border bg-card shadow-sm transition-opacity ${!p.is_active ? "opacity-60" : ""}`}>
      {/* Main content */}
      <div className="flex gap-3 p-3" onClick={() => setExpanded((e) => !e)}>
        {/* Image */}
        <div className="h-16 w-16 shrink-0 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
          {showPlaceholder ? (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          ) : (
            <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{categoryLabel}</p>
            </div>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-sm font-bold text-foreground">{formatPrice(p.discounted_price ?? p.price)}</span>
            <span className={`text-xs font-medium ${p.stock <= 5 ? "text-destructive" : p.stock <= 20 ? "text-amber-600" : "text-green-600"}`}>
              {p.stock === 0 ? "Out of stock" : p.stock <= 5 ? `Low: ${p.stock}` : `Stock: ${p.stock}`}
            </span>
            {p.is_featured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t px-3 py-3 space-y-3">
          {/* Extra details */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {p.model_number && <p>Model: <span className="text-foreground">{p.model_number}</span></p>}
            {p.sku && <p>SKU: <span className="text-foreground">{p.sku}</span></p>}
            {p.updated_at && <p>Updated: <span className="text-foreground">{new Date(p.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></p>}
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-xs min-h-[44px]">
              <Switch
                checked={p.is_active}
                disabled={isToggling}
                onCheckedChange={(v) => onToggle(p.id, "is_active", v)}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-xs min-h-[44px]">
              <Switch
                checked={p.is_featured}
                disabled={isToggling}
                onCheckedChange={(v) => onToggle(p.id, "is_featured", v)}
              />
              Featured
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 min-h-[44px]" asChild>
              <Link to={`/admin/products/${p.id}/edit`}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 min-h-[44px] text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => onDelete(p.id)}
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCardMobile;
