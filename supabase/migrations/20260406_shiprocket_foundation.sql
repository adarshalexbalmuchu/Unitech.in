-- ============================================================
-- Migration: ShipRocket Integration Foundation
-- Date:      2026-04-06
-- Purpose:   Adds all DB infrastructure required by ShipRocket
--            integration. No existing columns are dropped or
--            modified. Safe to apply on top of
--            20260313_create_orders_and_policies.sql.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. PRODUCTS — shipping dimensions + HSN code
--    Products table pre-exists; these columns are new.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight_kg  DECIMAL(8,3),
  ADD COLUMN IF NOT EXISTS length_cm  DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS width_cm   DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS height_cm  DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS hsn_code   TEXT;


-- ─────────────────────────────────────────────────────────────
-- 2. ORDERS — fulfillment + cancellation fields
--    The existing `status` column and its CHECK constraint are
--    untouched. fulfillment_status tracks ShipRocket lifecycle
--    independently of Razorpay payment status.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_status    TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method        TEXT NOT NULL DEFAULT 'prepaid',
  ADD COLUMN IF NOT EXISTS cancellation_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason   TEXT;

-- Valid fulfillment_status values (enforced in application layer via
-- fulfillment-states.ts, not as a DB CHECK, to allow migration without
-- locking rows on a large table):
--   pending | sr_push_failed | courier_pending | processing |
--   shipped | out_for_delivery | delivered | ndr_pending |
--   rto | returned | cancelled | manual_review


-- ─────────────────────────────────────────────────────────────
-- 3. SHIPMENTS
--    One order can have multiple shipments (split consignments).
--    AWB + courier details live here, not on orders.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shipments (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                 UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shiprocket_order_id      TEXT,
  shiprocket_shipment_id   TEXT,
  awb_number               TEXT,
  courier_id               TEXT,
  courier_name             TEXT,
  tracking_url             TEXT,
  fulfillment_status       TEXT        NOT NULL DEFAULT 'pending',
  courier_selection_method TEXT        NOT NULL DEFAULT 'auto',
  declared_weight_kg       DECIMAL(8,3),
  declared_length_cm       DECIMAL(8,2),
  declared_width_cm        DECIMAL(8,2),
  declared_height_cm       DECIMAL(8,2),
  declared_zone            TEXT,
  origin_pincode           TEXT,
  destination_pincode      TEXT,
  estimated_delivery       DATE,
  shipped_at               TIMESTAMPTZ,
  delivered_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Re-use the set_updated_at() trigger function created in the previous migration
DROP TRIGGER IF EXISTS trg_shipments_updated_at ON public.shipments;
CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 4. NDR ACTIONS
--    Tracks failed delivery attempts and admin/system responses
--    before ShipRocket auto-initiates RTO.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ndr_actions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id     UUID        NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  ndr_reason      TEXT,
  raised_at       TIMESTAMPTZ,
  action_taken    TEXT        CHECK (action_taken IN ('reattempt', 'update_address', 'cancel_rto')),
  action_taken_by TEXT,       -- 'system' or admin user_id UUID as text
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────
-- 5. SHIPROCKET AUDIT LOG
--    Full trail of every ShipRocket API call — request, response,
--    status code, and timestamp. PII in payloads is redacted via
--    the redacted_at column once a shipment reaches terminal state.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shiprocket_audit_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID        REFERENCES public.orders(id)    ON DELETE SET NULL,
  shipment_id      UUID        REFERENCES public.shipments(id) ON DELETE SET NULL,
  action           TEXT        NOT NULL,
  -- Valid action values:
  --   create_order | cancel_order | generate_label | schedule_pickup |
  --   generate_manifest | track | check_serviceability | refresh_token |
  --   assign_courier | create_refund
  request_payload  JSONB,
  response_payload JSONB,
  status_code      INTEGER,
  success          BOOLEAN,
  error_message    TEXT,
  called_by        TEXT        NOT NULL DEFAULT 'system',
  called_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  redacted_at      TIMESTAMPTZ -- set by nightly cleanup job once shipment is terminal
);


-- ─────────────────────────────────────────────────────────────
-- 6. SHIPROCKET EVENT LOG
--    Stores processed ShipRocket webhook event IDs to guarantee
--    exactly-once processing. The UNIQUE constraint is the actual
--    idempotency guard — the application check is an optimisation.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shiprocket_event_log (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shiprocket_event_id TEXT        UNIQUE NOT NULL,
  event_type          TEXT,
  processed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────
-- 7. COURIER CONFIG
--    Per-courier operational settings. Manifest sequence varies
--    by courier — the admin UI reads this to show advisory hints
--    without hard-gating the workflow.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courier_config (
  courier_id        TEXT        PRIMARY KEY,
  courier_name      TEXT        NOT NULL,
  manifest_sequence TEXT        NOT NULL CHECK (manifest_sequence IN ('pickup_first', 'manifest_first', 'either')),
  notes             TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed known couriers. ON CONFLICT DO NOTHING makes this re-runnable.
INSERT INTO public.courier_config (courier_id, courier_name, manifest_sequence, notes)
VALUES
  ('delhivery',  'Delhivery',  'either',         NULL),
  ('bluedart',   'BlueDart',   'pickup_first',   'Requires pickup to be scheduled before manifest generation'),
  ('dtdc',       'DTDC',       'manifest_first', 'Requires manifest to be generated before scheduling pickup'),
  ('ekart',      'Ekart',      'either',         NULL),
  ('xpressbees', 'Xpressbees', 'either',         NULL)
ON CONFLICT (courier_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 8. INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_shipments_order_id
  ON public.shipments(order_id);

CREATE INDEX IF NOT EXISTS idx_shipments_awb_number
  ON public.shipments(awb_number);

CREATE INDEX IF NOT EXISTS idx_shipments_fulfillment_status
  ON public.shipments(fulfillment_status);

CREATE INDEX IF NOT EXISTS idx_audit_log_order_id
  ON public.shiprocket_audit_log(order_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_called_at
  ON public.shiprocket_audit_log(called_at DESC);

-- shiprocket_event_log(shiprocket_event_id) — already indexed by UNIQUE constraint

CREATE INDEX IF NOT EXISTS idx_ndr_actions_shipment_id
  ON public.ndr_actions(shipment_id);


-- ─────────────────────────────────────────────────────────────
-- 9. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.shipments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ndr_actions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shiprocket_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shiprocket_event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_config     ENABLE ROW LEVEL SECURITY;

-- Shipments: authenticated users can view shipments for their own orders
DROP POLICY IF EXISTS "Users can view own shipments" ON public.shipments;
CREATE POLICY "Users can view own shipments"
  ON public.shipments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = shipments.order_id
        AND o.user_id = auth.uid()
    )
  );

-- Shipments: admins have full access
DROP POLICY IF EXISTS "Admins can manage shipments" ON public.shipments;
CREATE POLICY "Admins can manage shipments"
  ON public.shipments
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Audit log: admins can read; writes are service-role only (bypasses RLS)
DROP POLICY IF EXISTS "Admins can view audit log" ON public.shiprocket_audit_log;
CREATE POLICY "Admins can view audit log"
  ON public.shiprocket_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- NDR actions: admins can read and update
DROP POLICY IF EXISTS "Admins can manage ndr actions" ON public.ndr_actions;
CREATE POLICY "Admins can manage ndr actions"
  ON public.ndr_actions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Courier config: public read (checkout serviceability hints need this)
DROP POLICY IF EXISTS "Public can read courier config" ON public.courier_config;
CREATE POLICY "Public can read courier config"
  ON public.courier_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Courier config: admins can modify
DROP POLICY IF EXISTS "Admins can manage courier config" ON public.courier_config;
CREATE POLICY "Admins can manage courier config"
  ON public.courier_config
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- shiprocket_event_log: no user-facing access needed.
-- All reads and writes go through service role in Edge Functions (bypasses RLS).
