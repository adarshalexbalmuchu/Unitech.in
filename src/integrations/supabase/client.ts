import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Create client - works even without env vars (features that need Supabase will gracefully degrade)
export const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null as SupabaseClient | null;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
