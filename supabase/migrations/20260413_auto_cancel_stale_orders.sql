-- Auto-cancel orders stuck in pending/payment_initiated for > 30 minutes.
-- These are orders where the user never completed payment (dismissed modal,
-- payment failed, browser crashed, etc.).

CREATE OR REPLACE FUNCTION public.auto_cancel_stale_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cancelled_count integer;
BEGIN
  WITH stale AS (
    SELECT id
    FROM orders
    WHERE status IN ('pending', 'payment_initiated')
      AND created_at < now() - interval '30 minutes'
      AND (fulfillment_status IS NULL OR fulfillment_status NOT IN ('cancelled'))
    FOR UPDATE SKIP LOCKED
  )
  UPDATE orders
  SET status = 'failed',
      fulfillment_status = 'cancelled',
      cancellation_reason = 'auto_stale_payment'
  FROM stale
  WHERE orders.id = stale.id;

  GET DIAGNOSTICS cancelled_count = ROW_COUNT;
  RETURN cancelled_count;
END;
$$;

-- Also auto-cancel orders that already have status='failed' but were never
-- marked as cancelled in fulfillment_status (legacy cleanup).
CREATE OR REPLACE FUNCTION public.auto_cancel_failed_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cancelled_count integer;
BEGIN
  UPDATE orders
  SET fulfillment_status = 'cancelled',
      cancellation_reason = COALESCE(cancellation_reason, 'payment_failed')
  WHERE status = 'failed'
    AND (fulfillment_status IS NULL OR fulfillment_status NOT IN ('cancelled'));

  GET DIAGNOSTICS cancelled_count = ROW_COUNT;
  RETURN cancelled_count;
END;
$$;

-- Run the cleanup NOW for existing stale orders
SELECT public.auto_cancel_failed_orders();
SELECT public.auto_cancel_stale_orders();

-- Schedule via pg_cron if the extension is available.
-- Runs every 15 minutes. If pg_cron isn't enabled this will silently fail.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('auto-cancel-stale-orders');
    PERFORM cron.schedule(
      'auto-cancel-stale-orders',
      '*/15 * * * *',
      'SELECT public.auto_cancel_stale_orders(); SELECT public.auto_cancel_failed_orders();'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available — skipping schedule: %', SQLERRM;
END;
$$;
