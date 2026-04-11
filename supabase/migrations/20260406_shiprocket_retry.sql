-- ============================================================
-- Migration: ShipRocket Retry Infrastructure
-- Date:      2026-04-06
-- Purpose:   Adds retry_count column and partial index required
--            by the retry-shiprocket-orders Edge Function.
--            Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- ============================================================

-- retry_count tracks how many times the system has attempted to
-- push this order to ShipRocket. After 5 failures the retry function
-- escalates to manual_review.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- Partial index: only rows eligible for retry are indexed.
-- Covers the query in retry-shiprocket-orders which filters on
-- fulfillment_status = 'sr_push_failed', retry_count, and updated_at.
CREATE INDEX IF NOT EXISTS idx_orders_sr_retry
  ON public.orders(fulfillment_status, retry_count, updated_at)
  WHERE fulfillment_status = 'sr_push_failed';
