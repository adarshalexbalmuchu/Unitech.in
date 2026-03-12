import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Upload, X, ImageIcon } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

const generateId = () => `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const BUCKET = "product-images";

const uploadFile = async (file: File): Promise<string> => {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

const emptyProduct: Omit<Product, "id" | "created_at" | "updated_at"> = {
  name: "", slug: "", description: "", category: "", brand: "Unitech", model_number: "",
  price: null, original_price: null, image_url: "", images: [],
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
  const [uploading, setUploading] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEdit && products.length > 0) {
      const existing = products.find((p) => p.id === id);
      if (existing) {
        const { id: _, created_at, updated_at, ...rest } = existing;
        setForm(rest);
        setSpecsJson(JSON.stringify(existing.specs, null, 2));
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

  const handlePrimaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      set("image_url", url);
      toast({ title: "Image uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (primaryInputRef.current) primaryInputRef.current.value = "";
    }
  };

  const handleAdditionalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingAdditional(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file);
        urls.push(url);
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      toast({ title: `${urls.length} image(s) uploaded` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAdditional(false);
      if (additionalInputRef.current) additionalInputRef.current.value = "";
    }
  };

  const removeAdditionalImage = (index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let specs: ProductSpecs;
    try { specs = JSON.parse(specsJson); } catch { toast({ title: "Invalid specs JSON", variant: "destructive" }); return; }

    const now = new Date().toISOString();
    const slug = form.slug || slugify(form.name);

    if (isEdit) {
      const existing = products.find((p) => p.id === id)!;
      const updated: Product = { ...existing, ...form, slug, specs, updated_at: now };
      updateMutation.mutate(updated, {
        onSuccess: () => { toast({ title: "Product updated" }); navigate("/admin/products"); },
      });
    } else {
      const product: Product = {
        ...form, id: generateId(), slug, specs,
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

          {/* Media — File Upload */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Media</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              {/* Primary Image */}
              <div className="space-y-2">
                <Label>Primary Image</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {form.image_url && !form.image_url.includes("placeholder") ? (
                      <img src={form.image_url} alt="Primary" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={primaryInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePrimaryUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => primaryInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading…" : "Upload Image"}
                    </Button>
                    {form.image_url && form.image_url !== "/placeholder.svg" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-destructive"
                        onClick={() => set("image_url", "/placeholder.svg")}
                      >
                        <X className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Images */}
              <div className="space-y-2">
                <Label>Additional Images</Label>
                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.images.map((url, i) => (
                      <div key={i} className="relative group h-16 w-16 rounded-lg border border-border overflow-hidden">
                        <img src={url} alt={`Additional ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(i)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  ref={additionalInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAdditionalUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingAdditional}
                  onClick={() => additionalInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingAdditional ? "Uploading…" : "Add Images"}
                </Button>
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
