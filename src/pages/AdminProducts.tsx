import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAdminProducts, useDeleteProduct, useToggleProductField } from "@/hooks/useAdminProducts";
import { CATEGORIES, formatPrice } from "@/lib/constants";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductCardMobile from "@/components/admin/ProductCardMobile";
import ProductFilterSheet from "@/components/admin/ProductFilterSheet";
import FloatingActionButton from "@/components/admin/FloatingActionButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminProducts = () => {
  const { data: products = [], isLoading, isError, error, refetch } = useAdminProducts();
  const deleteMutation = useDeleteProduct();
  const toggleMutation = useToggleProductField();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortField, setSortField] = useState<"name" | "price" | "stock" | "updated_at">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = products;
    if (categoryFilter !== "all") items = items.filter((p) => p.category === categoryFilter);
    if (stockFilter === "in_stock") items = items.filter((p) => p.stock > 20);
    else if (stockFilter === "low_stock") items = items.filter((p) => p.stock >= 1 && p.stock <= 20);
    else if (stockFilter === "out_of_stock") items = items.filter((p) => p.stock === 0);
    if (featuredOnly) items = items.filter((p) => p.is_featured);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.model_number?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    // Sort
    items = [...items].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "price") cmp = ((a.discounted_price ?? a.price) || 0) - ((b.discounted_price ?? b.price) || 0);
      else if (sortField === "stock") cmp = a.stock - b.stock;
      else if (sortField === "updated_at") cmp = (a.updated_at || "").localeCompare(b.updated_at || "");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return items;
  }, [products, search, categoryFilter, stockFilter, featuredOnly, sortField, sortDir]);

  const activeFilterCount = [categoryFilter !== "all", stockFilter !== "all", featuredOnly].filter(Boolean).length;

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const resetFilters = () => {
    setCategoryFilter("all");
    setStockFilter("all");
    setFeaturedOnly(false);
  };

  const handleToggle = (id: string, field: "is_active" | "is_featured", value: boolean) => {
    setPendingToggleId(id);
    toggleMutation.mutate({ id, field, value }, {
      onSuccess: () => toast.success(`Product ${field === "is_active" ? (value ? "activated" : "deactivated") : (value ? "featured" : "unfeatured")}`),
      onError: (mutationError) => {
        toast.error("Failed to update product", { description: getErrorMessage(mutationError) });
      },
      onSettled: () => setPendingToggleId(null),
    });
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    setPendingDeleteId(confirmDeleteId);
    deleteMutation.mutate(confirmDeleteId, {
      onSuccess: () => toast.success("Product deleted"),
      onError: (mutationError) => {
        toast.error("Failed to delete product", { description: getErrorMessage(mutationError) });
      },
      onSettled: () => { setPendingDeleteId(null); setConfirmDeleteId(null); },
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Products</h1>
            <p className="text-xs md:text-sm text-muted-foreground">{products.length} total</p>
          </div>
          <div className="hidden md:flex gap-2">
            <Button variant="outline" asChild><Link to="/">← Site</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/orders">Orders</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/wholesale-leads">Leads</Link></Button>
            <Button asChild><Link to="/admin/products/new"><Plus className="h-4 w-4 mr-1" /> Add Product</Link></Button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 min-h-[44px]" />
          </div>
          {/* Mobile: bottom sheet filter */}
          {isMobile && (
            <ProductFilterSheet
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              stockFilter={stockFilter}
              onStockChange={setStockFilter}
              featuredOnly={featuredOnly}
              onFeaturedChange={setFeaturedOnly}
              onReset={resetFilters}
              activeFilterCount={activeFilterCount}
            />
          )}
          {/* Desktop: inline filters */}
          {!isMobile && (
            <>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Stock" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 w-full max-w-md bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
            <p className="text-muted-foreground text-sm">Loading products…</p>
          </div>
        ) : isError ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm text-destructive">Failed to load: {getErrorMessage(error)}</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">
              {products.length === 0
                ? "No products yet. Add your first product."
                : "No products match your filters."}
            </p>
            {products.length === 0 ? (
              <Button asChild><Link to="/admin/products/new">Add Product</Link></Button>
            ) : (
              <Button variant="outline" onClick={() => { setSearch(""); resetFilters(); }}>Clear Filters</Button>
            )}
          </div>
        ) : isMobile ? (
          /* ── MOBILE: Card Layout ──────────────────────────────── */
          <div className="space-y-3">
            {filtered.map((p) => (
              <ProductCardMobile
                key={p.id}
                product={p}
                onToggle={handleToggle}
                onDelete={handleDelete}
                isToggling={toggleMutation.isPending && pendingToggleId === p.id}
                isDeleting={deleteMutation.isPending && pendingDeleteId === p.id}
              />
            ))}
          </div>
        ) : (
          /* ── DESKTOP: Table Layout ────────────────────────────── */
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("name")}>
                        Product <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("price")}>
                        Price <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("stock")}>
                        Stock <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-center">Featured</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} className={!p.is_active ? "opacity-60" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded object-cover bg-muted" loading="lazy" />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-[220px]">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.model_number || p.sku || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs whitespace-nowrap">
                          {CATEGORIES.find((c) => c.slug === p.category)?.label || p.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(p.discounted_price ?? p.price)}</TableCell>
                      <TableCell className="text-center">
                        <span className={p.stock <= 5 ? "text-destructive font-medium" : p.stock <= 20 ? "text-amber-600 font-medium" : "text-foreground"}>{p.stock}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={p.is_active}
                          disabled={toggleMutation.isPending && pendingToggleId === p.id}
                          onCheckedChange={(v) => handleToggle(p.id, "is_active", v)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={p.is_featured}
                          disabled={toggleMutation.isPending && pendingToggleId === p.id}
                          onCheckedChange={(v) => handleToggle(p.id, "is_featured", v)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/products/${p.id}/edit`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* FAB for mobile */}
        {isMobile && <FloatingActionButton to="/admin/products/new" label="Add Product" />}

        {/* Delete confirmation */}
        <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The product will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
