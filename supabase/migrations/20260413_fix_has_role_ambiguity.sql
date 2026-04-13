-- Fix: drop the has_role(uuid, app_role) overload that causes PostgREST ambiguity
-- The has_role(uuid, text) overload is sufficient and is what the frontend uses.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'has_role'
      AND pg_get_function_identity_arguments(p.oid) LIKE '%app_role%'
  ) THEN
    DROP FUNCTION public.has_role(uuid, app_role);
  END IF;
END $$;
