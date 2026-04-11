-- ============================================================
-- Migration: ShipRocket Admin Operations Fields
-- Date:      2026-04-06
-- Purpose:   Adds columns to shipments table for label, pickup,
--            and manifest tracking used by admin Edge Functions.
--            Safe to re-run (ADD COLUMN IF NOT EXISTS).
-- ============================================================

-- Label fields (generate-label Edge Function)
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS label_url          TEXT,
  ADD COLUMN IF NOT EXISTS label_generated_at TIMESTAMPTZ;

-- Pickup fields (schedule-pickup Edge Function)
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS pickup_scheduled_date DATE,
  ADD COLUMN IF NOT EXISTS pickup_token          TEXT;

-- Manifest fields (generate-manifest Edge Function)
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS manifest_url  TEXT,
  ADD COLUMN IF NOT EXISTS manifested_at TIMESTAMPTZ;
