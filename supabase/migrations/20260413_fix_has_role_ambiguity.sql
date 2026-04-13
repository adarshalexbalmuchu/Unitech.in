-- Fix: drop the has_role(uuid, app_role) overload that causes PostgREST ambiguity.
-- Must first drop & recreate all RLS policies that reference it.

-- 1. Drop all policies that reference has_role(uuid, app_role)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
DROP POLICY IF EXISTS "Admin write categories" ON public.categories;
DROP POLICY IF EXISTS "Admin reads wholesale leads" ON public.wholesale_leads;
DROP POLICY IF EXISTS "Admin deletes wholesale leads" ON public.wholesale_leads;
DROP POLICY IF EXISTS "Admin only price_updates" ON public.price_updates;
DROP POLICY IF EXISTS "Admin only price_updates_staging" ON public.price_updates_staging;
DROP POLICY IF EXISTS "Admin only products_backup" ON public.products_backup;
DROP POLICY IF EXISTS "Admin write product_variants" ON public.product_variants;

-- 2. Recreate all policies using has_role(uuid, text)
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins manage products" ON public.products
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admin write categories" ON public.categories
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admin reads wholesale leads" ON public.wholesale_leads
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admin deletes wholesale leads" ON public.wholesale_leads
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admin only price_updates" ON public.price_updates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admin only price_updates_staging" ON public.price_updates_staging
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admin only products_backup" ON public.products_backup
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admin write product_variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- 3. Now safe to drop the ambiguous overload
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- 4. Convert user_roles.role from app_role enum to plain text
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;

-- 5. Drop the unused app_role type
DROP TYPE IF EXISTS public.app_role;
