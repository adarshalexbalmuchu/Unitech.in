import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://gzdudhvkohbuubgmhthe.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZHVkaHZrb2hidXViZ21odGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Nzc0MzEsImV4cCI6MjA4MzU1MzQzMX0.ejBGjbzp__rCjp_hoPGMa1CIA_qBpoYsBXBC5Gm1tTY";

// Create client - works even without env vars (features that need Supabase will gracefully degrade)
export const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null as any;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
