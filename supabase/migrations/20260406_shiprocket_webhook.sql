-- ============================================================
-- Migration: ShipRocket Webhook Support
-- Date:      2026-04-06
-- Purpose:   Expands the ndr_actions.action_taken CHECK constraint
--            to include 'auto_rto' — set by the shiprocket-webhook
--            handler when ShipRocket auto-initiates RTO on an
--            unresolved NDR.
--            Safe to re-run.
-- ============================================================

-- The original CHECK only allows: 'reattempt', 'update_address', 'cancel_rto'.
-- The webhook sets 'auto_rto' when closing an open NDR row on RTO event.
ALTER TABLE public.ndr_actions DROP CONSTRAINT IF EXISTS ndr_actions_action_taken_check;
ALTER TABLE public.ndr_actions
  ADD CONSTRAINT ndr_actions_action_taken_check
  CHECK (action_taken IN ('reattempt', 'update_address', 'cancel_rto', 'auto_rto'));
