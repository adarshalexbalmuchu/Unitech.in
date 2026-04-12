/*
  Run this in Supabase SQL editor before using this form:

  CREATE TABLE wholesale_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT,
    phone TEXT NOT NULL,
    city_state TEXT,
    business_name TEXT,
    business_type TEXT,
    categories TEXT[],
    monthly_volume TEXT,
    source TEXT,
    gst_number TEXT,
    created_at TIMESTAMP DEFAULT now()
  );

  ALTER TABLE wholesale_leads ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Allow public insert wholesale leads"
  ON wholesale_leads
  FOR INSERT
  TO public
  WITH CHECK (true);
*/

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { WHATSAPP_NUMBER } from "@/lib/constants";

const BUSINESS_TYPES = ["Retailer", "Dealer", "Distributor"] as const;

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

const MAJOR_CITIES = [
  "Agra", "Ahmedabad", "Amritsar", "Bangalore", "Bhopal", "Bhubaneswar",
  "Chandigarh", "Chennai", "Coimbatore", "Dehradun", "Delhi", "Faridabad",
  "Ghaziabad", "Gurgaon", "Guwahati", "Hyderabad", "Indore", "Jaipur",
  "Jamshedpur", "Jodhpur", "Kanpur", "Kochi", "Kolkata", "Lucknow",
  "Ludhiana", "Madurai", "Mangalore", "Meerut", "Mumbai", "Nagpur",
  "Nashik", "Noida", "Patna", "Pune", "Raipur", "Rajkot", "Ranchi",
  "Surat", "Thane", "Thiruvananthapuram", "Vadodara", "Varanasi",
  "Vijayawada", "Visakhapatnam", "Other",
] as const;

type FormData = {
  full_name: string;
  phone: string;
  city: string;
  state: string;
  business_name: string;
  business_type: string;
  gst_number: string;
};

const initialForm: FormData = {
  full_name: "",
  phone: "",
  city: "",
  state: "",
  business_name: "",
  business_type: "Retailer",
  gst_number: "",
};

const WholesaleApply = () => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const buildWhatsAppMessage = (): string => {
    const lines = [
      "Hello Unitech India,",
      "",
      "I'm interested in becoming a wholesale partner.",
      "",
      `Name: ${form.full_name}`,
      `Phone: ${form.phone}`,
      `City: ${form.city}`,
      `State: ${form.state}`,
      `Business: ${form.business_name}`,
      `Type: ${form.business_type}`,
      `GST: ${form.gst_number.trim() || "Not provided"}`,
      "",
      "Please share partnership details.",
    ];
    return lines.join("\n");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (supabase && isSupabaseConfigured) {
        const { error } = await supabase.from("wholesale_leads").insert({
          full_name: form.full_name,
          phone: form.phone,
          city_state: `${form.city}, ${form.state}`,
          business_name: form.business_name,
          business_type: form.business_type,
          gst_number: form.gst_number || null,
        });
        if (error) throw error;
      }

      setSuccess(true);

      // Redirect to WhatsApp after brief success state
      setTimeout(() => {
        const msg = encodeURIComponent(buildWhatsAppMessage());
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank", "noopener,noreferrer");
      }, 1500);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <StickyHeader />
        <div className="max-w-lg mx-auto px-4 py-20 md:py-32 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-foreground">Application received.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We'll contact you within 24 hours. Redirecting to WhatsApp...
          </p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StickyHeader />

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Back link */}
        <Link
          to="/wholesale"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Wholesale
        </Link>

        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">
          Apply for Partnership
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Fill in your details below. No upfront fees — we'll reach out within 24 hours.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Phone */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                required
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
                placeholder="10-digit mobile number"
              />
            </div>
          </div>

          {/* City & State */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">City *</Label>
              <select
                id="city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select city</option>
                {MAJOR_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State *</Label>
              <select
                id="state"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Business Name */}
          <div className="space-y-1.5">
            <Label htmlFor="business_name">Business Name *</Label>
            <Input
              id="business_name"
              value={form.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              required
              placeholder="Your shop or company name"
            />
          </div>

          {/* Business Type */}
          <div className="space-y-1.5">
            <Label htmlFor="business_type">Business Type</Label>
            <select
              id="business_type"
              value={form.business_type}
              onChange={(e) => set("business_type", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* GST */}
          <div className="space-y-1.5">
            <Label htmlFor="gst_number">GST Number</Label>
            <Input
              id="gst_number"
              value={form.gst_number}
              onChange={(e) => set("gst_number", e.target.value)}
              placeholder="Optional — speeds up onboarding"
            />
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </form>
      </div>

      <SiteFooter />
    </div>
  );
};

export default WholesaleApply;
