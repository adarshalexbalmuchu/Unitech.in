import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { CATEGORIES } from "@/lib/constants";

interface ProductFilterSheetProps {
  categoryFilter: string;
  onCategoryChange: (val: string) => void;
  stockFilter: string;
  onStockChange: (val: string) => void;
  featuredOnly: boolean;
  onFeaturedChange: (val: boolean) => void;
  onReset: () => void;
  activeFilterCount: number;
}

const ProductFilterSheet = ({
  categoryFilter,
  onCategoryChange,
  stockFilter,
  onStockChange,
  featuredOnly,
  onFeaturedChange,
  onReset,
  activeFilterCount,
}: ProductFilterSheetProps) => (
  <Drawer>
    <DrawerTrigger asChild>
      <Button variant="outline" size="icon" className="relative shrink-0 min-h-[44px] min-w-[44px]">
        <Filter className="h-4 w-4" />
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </Button>
    </DrawerTrigger>
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Filters</DrawerTitle>
      </DrawerHeader>
      <div className="px-4 space-y-5 pb-2">
        {/* Category */}
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stock status */}
        <div className="space-y-1.5">
          <Label>Stock Status</Label>
          <Select value={stockFilter} onValueChange={onStockChange}>
            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="in_stock">In Stock (&gt;20)</SelectItem>
              <SelectItem value="low_stock">Low Stock (1-20)</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Featured toggle */}
        <label className="flex items-center justify-between min-h-[44px]">
          <Label>Featured Only</Label>
          <Switch checked={featuredOnly} onCheckedChange={onFeaturedChange} />
        </label>
      </div>
      <DrawerFooter className="flex-row gap-2">
        <DrawerClose asChild>
          <Button variant="outline" className="flex-1" onClick={onReset}>Reset</Button>
        </DrawerClose>
        <DrawerClose asChild>
          <Button className="flex-1">Apply</Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);

export default ProductFilterSheet;
