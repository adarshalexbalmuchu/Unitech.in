import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminProducts, useCreateProduct, useUpdateProduct } from "@/hooks/useAdminProducts";
import { CATEGORIES, COLLECTIONS } from "@/lib/constants";
import type { Product, ProductSpecs } from "@/hooks/useProducts";
import type { Collection } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";

const generateId = () => `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const emptyProduct: Omit<Product, "id" | "created_at" | "updated_at"> = {
  name: "", slug: "", description: "", category: "", brand: "Unitech", model_number: "",
  price: null, original_price: null, image_url: "/placeholder.svg", images: [],
  collections: [], is_featured: false, is_active: true, stock: 0, sku: "",
  rating: 0, reviews_count: 0, specs: {}, sale_start: null, sale_end: null,
};

const AdminProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { data: products = [] } = useAdminProducts();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [form, setForm] = useState<Omit<Product, "id" | "created_at" | "updated_at">>(emptyProduct);
  const [specsJson, setSpecsJson] = useState("{}");
  const [specsError, setSpecsError] = useState("");
  const [imagesText, setImagesText] = useState("");

  // Load existing product
  useEffect(() => {
    if (isEdit && products.length > 0) {
      const existing = products.find((p) => p.id === id);
      if (existing) {
        const { id: _, created_at, updated_at, ...rest } = existing;
        setForm(rest);
        setSpecsJson(JSON.stringify(existing.specs, null, 2));
        setImagesText(existing.images.join("\n"));
      }
    }
  }, [isEdit, id, products]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleCollection = (col: Collection) => {
    setForm((prev) => ({
      ...prev,
      collections: prev.collections.includes(col)
        ? prev.collections.filter((c) => c !== col)
        : [...prev.collections, col],
    }));
  };

  const handleSpecsChange = (val: string) => {
    setSpecsJson(val);
    try { JSON.parse(val); setSpecsError(""); } catch { setSpecsError("Invalid JSON"); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let specs: ProductSpecs;
    try { specs = JSON.parse(specsJson); } catch { toast({ title: "Invalid specs JSON", variant: "destructive" }); return; }

    const now = new Date().toISOString();
    const slug = form.slug || slugify(form.name);
    const images = imagesText.split("\n").map((s) => s.trim()).filter(Boolean);

    if (isEdit) {
      const existing = products.find((p) => p.id === id)!;
      const updated: Product = { ...existing, ...form, slug, specs, images, updated_at: now };
      updateMutation.mutate(updated, {
        onSuccess: () => { toast({ title: "Product updated" }); navigate("/admin/products"); },
      });
    } else {
      const product: Product = {
        ...form, id: generateId(), slug, specs, images,
        created_at: now, updated_at: now,
      };
      createMutation.mutate(product, {
        onSuccess: () => { toast({ title: "Product created" }); navigate("/admin/products"); },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">{isEdit ? "Edit Product" : "Add Product"}</h1>
          <Button variant="outline" asChild><Link to="/admin/products">← Back</Link></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => set("category", v)} required>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" value={form.brand || ""} onChange={(e) => set("brand", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="model">Model Number</Label>
                  <Input id="model" value={form.model_number || ""} onChange={(e) => set("model_number", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Pricing & Inventory</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" type="number" value={form.price ?? ""} onChange={(e) => set("price", e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="oprice">Original Price (₹)</Label>
                <Input id="oprice" type="number" value={form.original_price ?? ""} onChange={(e) => set("original_price", e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={form.sku || ""} onChange={(e) => set("sku", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Media</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="imgurl">Primary Image URL</Label>
                <Input id="imgurl" value={form.image_url} onChange={(e) => set("image_url", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="images">Additional Images (one URL per line)</Label>
                <Textarea id="images" value={imagesText} onChange={(e) => setImagesText(e.target.value)} rows={3} placeholder="/img1.jpg&#10;/img2.jpg" />
              </div>
            </CardContent>
          </Card>

          {/* Flags & Collections */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Flags & Collections</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch id="active" checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
                  <Label htmlFor="active">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="featured" checked={form.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
                  <Label htmlFor="featured">Featured</Label>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Collections</Label>
                <div className="flex gap-4">
                  {COLLECTIONS.map((col) => (
                    <label key={col} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={form.collections.includes(col)} onCheckedChange={() => toggleCollection(col)} />
                      {col}
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specs */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Specifications (JSON)</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                value={specsJson}
                onChange={(e) => handleSpecsChange(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              {specsError && <p className="text-destructive text-sm mt-1">{specsError}</p>}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/products")}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEdit ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProductForm;
