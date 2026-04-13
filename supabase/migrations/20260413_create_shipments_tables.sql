-- ============================================================
-- Migration: Create shipments + supporting tables
-- Date:      2026-04-13
-- Purpose:   Creates shipments, ndr_actions, audit/event log,
--            courier_config tables. Adds fulfillment columns to
--            orders. Replaces has_role() refs with direct
--            user_roles checks.
-- ============================================================

-- ── 1. ORDERS — fulfillment + cancellation fields ──────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_status    TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method        TEXT NOT NULL DEFAULT 'prepaid',
  ADD COLUMN IF NOT EXISTS cancellation_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason   TEXT,
  ADD COLUMN IF NOT EXISTS retry_count           INTEGER NOT NULL DEFAULT 0;

-- ── 2. PRODUCTS — shipping dimensions ──────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight_kg  DECIMAL(8,3),
  ADD COLUMN IF NOT EXISTS length_cm  DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS width_cm   DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS height_cm  DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS hsn_code   TEXT;

-- ── 3. SHIPMENTS ───────────────────────────────────────────
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
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Admin operation fields
  label_url                TEXT,
  label_generated_at       TIMESTAMPTZ,
  pickup_scheduled_date    DATE,
  pickup_token             TEXT,
  manifest_url             TEXT,
  manifested_at            TIMESTAMPTZ
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_shipments_updated_at ON public.shipments;
CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── 4. NDR ACTIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ndr_actions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id     UUID        NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  ndr_reason      TEXT,
  raised_at       TIMESTAMPTZ,
  action_taken    TEXT        CHECK (action_taken IN ('reattempt', 'update_address', 'cancel_rto', 'auto_rto')),
  action_taken_by TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. AUDIT LOG ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shiprocket_audit_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID        REFERENCES public.orders(id)    ON DELETE SET NULL,
  shipment_id      UUID        REFERENCES public.shipments(id) ON DELETE SET NULL,
  action           TEXT        NOT NULL,
  request_payload  JSONB,
  response_payload JSONB,
  status_code      INTEGER,
  success          BOOLEAN,
  error_message    TEXT,
  called_by        TEXT        NOT NULL DEFAULT 'system',
  called_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  redacted_at      TIMESTAMPTZ
);

-- ── 6. EVENT LOG (idempotency) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.shiprocket_event_log (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shiprocket_event_id TEXT        UNIQUE NOT NULL,
  event_type          TEXT,
  processed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 7. COURIER CONFIG ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courier_config (
  courier_id        TEXT        PRIMARY KEY,
  courier_name      TEXT        NOT NULL,
  manifest_sequence TEXT        NOT NULL CHECK (manifest_sequence IN ('pickup_first', 'manifest_first', 'either')),
  notes             TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.courier_config (courier_id, courier_name, manifest_sequence, notes)
VALUES
  ('delhivery',  'Delhivery',  'either',         NULL),
  ('bluedart',   'BlueDart',   'pickup_first',   'Requires pickup before manifest'),
  ('dtdc',       'DTDC',       'manifest_first', 'Requires manifest before pickup'),
  ('ekart',      'Ekart',      'either',         NULL),
  ('xpressbees', 'Xpressbees', 'either',         NULL)
ON CONFLICT (courier_id) DO NOTHING;

-- ── 8. INDEXES ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_shipments_order_id          ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_awb_number        ON public.shipments(awb_number);
CREATE INDEX IF NOT EXISTS idx_shipments_fulfillment_status ON public.shipments(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_audit_log_order_id          ON public.shiprocket_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_called_at         ON public.shiprocket_audit_log(called_at DESC);
CREATE INDEX IF NOT EXISTS idx_ndr_actions_shipment_id     ON public.ndr_actions(shipment_id);

-- ── 9. ROW LEVEL SECURITY ──────────────────────────────────
ALTER TABLE public.shipments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ndr_actions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shiprocket_audit_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shiprocket_event_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_config         ENABLE ROW LEVEL SECURITY;

-- Shipments: users see own orders' shipments
DROP POLICY IF EXISTS "Users can view own shipments" ON public.shipments;
CREATE POLICY "Users can view own shipments"
  ON public.shipments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = shipments.order_id AND o.user_id = auth.uid()
    )
  );

-- Shipments: admins full access (direct user_roles check, no has_role)
DROP POLICY IF EXISTS "Admins can manage shipments" ON public.shipments;
CREATE POLICY "Admins can manage shipments"
  ON public.shipments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Audit log: admins read only
DROP POLICY IF EXISTS "Admins can view audit log" ON public.shiprocket_audit_log;
CREATE POLICY "Admins can view audit log"
  ON public.shiprocket_audit_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- NDR actions: admins manage
DROP POLICY IF EXISTS "Admins can manage ndr actions" ON public.ndr_actions;
CREATE POLICY "Admins can manage ndr actions"
  ON public.ndr_actions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Courier config: public read
DROP POLICY IF EXISTS "Public can read courier config" ON public.courier_config;
CREATE POLICY "Public can read courier config"
  ON public.courier_config FOR SELECT TO anon, authenticated
  USING (true);

-- Courier config: admins manage
DROP POLICY IF EXISTS "Admins can manage courier config" ON public.courier_config;
CREATE POLICY "Admins can manage courier config"
  ON public.courier_config FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
