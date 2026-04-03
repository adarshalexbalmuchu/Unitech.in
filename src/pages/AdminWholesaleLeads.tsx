/*
  Ensure these RLS policies exist for the wholesale_leads table:

  -- Allow authenticated users (admin) to read leads
  CREATE POLICY "Allow authenticated read wholesale leads"
  ON wholesale_leads FOR SELECT
  TO authenticated
  USING (true);

  -- Allow authenticated users (admin) to delete leads
  CREATE POLICY "Allow authenticated delete wholesale leads"
  ON wholesale_leads FOR DELETE
  TO authenticated
  USING (true);
*/

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Trash2, Phone, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

type WholesaleLead = {
  id: string;
  full_name: string;
  phone: string;
  city_state: string;
  business_name: string;
  business_type: string;
  categories: string[];
  monthly_volume: string;
  source: string;
  gst_number: string | null;
  created_at: string;
};

const useWholesaleLeads = () =>
  useQuery({
    queryKey: ["wholesale_leads"],
    queryFn: async (): Promise<WholesaleLead[]> => {
      if (!supabase || !isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from("wholesale_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as WholesaleLead[]) || [];
    },
  });

const useDeleteLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase || !isSupabaseConfigured) throw new Error("Supabase not configured");
      const { error } = await supabase.from("wholesale_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wholesale_leads"] }),
  });
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminWholesaleLeads = () => {
  const { data: leads = [], isLoading, isError, error, refetch } = useWholesaleLeads();
  const deleteMutation = useDeleteLead();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    let items = leads;
    if (typeFilter !== "all") items = items.filter((l) => l.business_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (l) =>
          l.full_name.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.business_name.toLowerCase().includes(q) ||
          l.city_state.toLowerCase().includes(q)
      );
    }
    return items;
  }, [leads, search, typeFilter]);

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Lead deleted"),
      onError: (err) =>
        toast.error("Failed to delete", {
          description: err instanceof Error ? err.message : "Unknown error",
        }),
    });
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">Wholesale Leads</h1>
            <Button variant="outline" asChild>
              <Link to="/admin/products">← Products</Link>
            </Button>
          </div>
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              Supabase is not configured. Wholesale leads will appear here once the database is connected.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Wholesale Leads</h1>
            <p className="text-sm text-muted-foreground">
              {leads.length} application{leads.length !== 1 ? "s" : ""} received
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/products">← Products</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">← Back to Site</Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, phone, business, city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[180px]"
          >
            <option value="all">All Types</option>
            <option value="Retailer">Retailer</option>
            <option value="Dealer">Dealer</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <p className="text-muted-foreground py-12 text-center">Loading leads…</p>
        ) : isError ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm text-destructive">
              Failed to load leads: {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              {leads.length === 0
                ? "No wholesale applications yet."
                : "No leads match your search/filter."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Business</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-[180px]">
                              {lead.business_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{lead.city_state}</p>
                            {lead.gst_number && (
                              <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                                GST: {lead.gst_number}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{lead.full_name}</p>
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-xs text-primary hover:underline flex items-center gap-1 w-fit"
                          >
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {lead.business_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(lead.categories || []).map((cat) => (
                              <Badge key={cat} variant="outline" className="text-[10px] px-1.5 py-0">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {lead.monthly_volume || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{lead.source || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(lead.created_at)}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60">
                            {formatTime(lead.created_at)}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, "").replace(/^(?!91)/, "91")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
                              title="WhatsApp"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                            </a>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-destructive/10 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove {lead.full_name}'s application.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(lead.id)}>
                                    Delete
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

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((lead) => (
                <div key={lead.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{lead.business_name}</p>
                      <p className="text-xs text-muted-foreground">{lead.city_state}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {lead.business_type}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Contact</p>
                      <p className="font-medium">{lead.full_name}</p>
                      <a href={`tel:${lead.phone}`} className="text-primary">
                        {lead.phone}
                      </a>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Volume</p>
                      <p className="font-medium">{lead.monthly_volume || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Categories</p>
                      <p className="font-medium">{(lead.categories || []).join(", ") || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Applied</p>
                      <p className="font-medium">{formatDate(lead.created_at)}</p>
                    </div>
                    {lead.gst_number && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">GST</p>
                        <p className="font-medium font-mono">{lead.gst_number}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, "").replace(/^(?!91)/, "91")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        WhatsApp
                      </Button>
                    </a>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove {lead.full_name}'s application.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(lead.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminWholesaleLeads;
