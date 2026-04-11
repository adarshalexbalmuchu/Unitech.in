-- ============================================================================
-- Migration: 20260406_shiprocket_cron.sql
-- Purpose:   Schedule nightly PII redaction via pg_cron
-- Requires:  pg_cron and pg_net extensions
-- ============================================================================

-- Enable required extensions (safe — no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron  WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net   WITH SCHEMA extensions;

-- ── Schedule: nightly at 02:00 UTC ──────────────────────────────────────────
-- Invokes the redact-shiprocket-pii Edge Function via HTTP POST.
-- Uses the CRON_SECRET header for authentication (no JWT needed).
-- The function URL is built from the SUPABASE_URL env variable pattern.
--
-- NOTE: Replace <YOUR_SUPABASE_URL> and <YOUR_CRON_SECRET> with actual values
-- during deployment, or use Vault secrets (see below).
--
-- The cron job POSTs to the Edge Function — it does not run PL/pgSQL.
-- ────────────────────────────────────────────────────────────────────────────

-- Using Vault for secrets (recommended):
-- INSERT INTO vault.secrets (name, secret) VALUES ('cron_secret', '<YOUR_CRON_SECRET>');
-- Then reference: (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')

SELECT cron.schedule(
  'nightly-pii-redaction',           -- job name
  '0 2 * * *',                       -- cron expression: daily at 02:00 UTC
  $$
  SELECT net.http_post(
    url     := current_setting('app.settings.supabase_url') || '/functions/v1/redact-shiprocket-pii',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'X-Cron-Secret',  current_setting('app.settings.cron_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ── Helpful views ───────────────────────────────────────────────────────────

COMMENT ON COLUMN cron.job.jobname IS 'Descriptive name for pg_cron job';

-- To check scheduled jobs:   SELECT * FROM cron.job;
-- To check run history:      SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- To unschedule:             SELECT cron.unschedule('nightly-pii-redaction');
