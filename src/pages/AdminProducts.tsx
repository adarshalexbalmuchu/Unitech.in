import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminProducts = () => {
  const { data: products = [], isLoading, isError, error, refetch } = useAdminProducts();
  const deleteMutation = useDeleteProduct();
  const toggleMutation = useToggleProductField();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = products;
    if (categoryFilter !== "all") items = items.filter((p) => p.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.model_number?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [products, search, categoryFilter]);

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
    setPendingDeleteId(id);
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Product deleted"),
      onError: (mutationError) => {
        toast.error("Failed to delete product", { description: getErrorMessage(mutationError) });
      },
      onSettled: () => setPendingDeleteId(null),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Product Management</h1>
            <p className="text-sm text-muted-foreground">{products.length} total products</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/">← Back to Site</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/orders">Orders</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/wholesale-leads">Wholesale Leads</Link></Button>
            <Button asChild><Link to="/admin/products/new"><Plus className="h-4 w-4 mr-1" /> Add Product</Link></Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name, model, category…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <p className="text-muted-foreground py-12 text-center">Loading products…</p>
        ) : isError ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm text-destructive">Failed to load products: {getErrorMessage(error)}</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">
              {products.length === 0
                ? "No products available yet. Add your first product to start the catalog."
                : "No products match your current search/filter."}
            </p>
            {products.length === 0 ? (
              <Button asChild>
                <Link to="/admin/products/new">Add Product</Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={() => { setSearch(""); setCategoryFilter("all"); }}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
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
                        <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded object-cover bg-muted" />
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
                      <span className={p.stock <= 5 ? "text-destructive font-medium" : "text-foreground"}>{p.stock}</span>
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
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={Boolean(pendingDeleteId)}
                          onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete product?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently remove "{p.name}". This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(p.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deleteMutation.isPending && pendingDeleteId === p.id}
                              >
                                {deleteMutation.isPending && pendingDeleteId === p.id ? "Deleting…" : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
