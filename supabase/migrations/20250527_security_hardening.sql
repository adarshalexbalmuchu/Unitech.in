-- ═══════════════════════════════════════════════════════════════════════════
-- Security Hardening Migration — 2025-05-27
-- Fixes: RLS gaps, privilege escalation, excessive grants, missing indexes,
--        missing FK/CHECK constraints, duplicate policies, search_path hijack
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Enable RLS on unprotected tables
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_updates_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products_backup ENABLE ROW LEVEL SECURITY;

-- product_variants: public read, admin write
CREATE POLICY "Public read product_variants" ON public.product_variants
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write product_variants" ON public.product_variants
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- price_updates: admin only
CREATE POLICY "Admin only price_updates" ON public.price_updates
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Admin only price_updates_staging" ON public.price_updates_staging
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- products_backup: admin only
CREATE POLICY "Admin only products_backup" ON public.products_backup
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Remove duplicate/dangerous RLS policies
-- ───────────────────────────────────────────────────────────────────────────

-- "Public read products" (qual=true) bypasses is_active filter — REMOVE
DROP POLICY IF EXISTS "Public read products" ON public.products;

-- Duplicate SELECT on user_roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Fix profiles UPDATE policy (prevent is_admin self-escalation)
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Belt-and-suspenders: revoke UPDATE on is_admin column
REVOKE UPDATE (is_admin) ON public.profiles FROM anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Revoke excessive grants from anon
-- ───────────────────────────────────────────────────────────────────────────
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_roles FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.orders FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.order_items FROM anon;
REVOKE ALL ON public.price_updates FROM anon;
REVOKE ALL ON public.price_updates_staging FROM anon;
REVOKE ALL ON public.products_backup FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.cart_items FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.wishlist FROM anon;

-- Revoke TRUNCATE from authenticated (never allowed via API)
REVOKE TRUNCATE ON public.products FROM authenticated;
REVOKE TRUNCATE ON public.orders FROM authenticated;
REVOKE TRUNCATE ON public.order_items FROM authenticated;
REVOKE TRUNCATE ON public.profiles FROM authenticated;
REVOKE TRUNCATE ON public.user_roles FROM authenticated;
REVOKE TRUNCATE ON public.cart_items FROM authenticated;
REVOKE TRUNCATE ON public.wishlist FROM authenticated;
REVOKE TRUNCATE ON public.wholesale_leads FROM authenticated;
REVOKE TRUNCATE ON public.categories FROM authenticated;
REVOKE TRUNCATE ON public.product_variants FROM authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Secure SECURITY DEFINER functions with explicit search_path
-- ───────────────────────────────────────────────────────────────────────────
-- has_role only has a (uuid, text) overload; no app_role type exists
ALTER FUNCTION public.has_role(uuid, text) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.cancel_stale_orders() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;

-- ───────────────────────────────────────────────────────────────────────────
-- 6. Add missing indexes for performance
-- ───────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status ON public.orders (user_id, status);

-- ───────────────────────────────────────────────────────────────────────────
-- 7. Add CHECK constraints for data integrity
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.products
  ADD CONSTRAINT chk_products_price CHECK (price >= 0),
  ADD CONSTRAINT chk_products_stock CHECK (stock >= 0);

ALTER TABLE public.order_items
  ADD CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  ADD CONSTRAINT chk_order_items_price CHECK (price >= 0);

ALTER TABLE public.cart_items
  ADD CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0);

-- ───────────────────────────────────────────────────────────────────────────
-- 8. Add updated_at auto-trigger on products
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────────────
-- 9. Add missing FK constraints
-- ───────────────────────────────────────────────────────────────────────────

-- Clean orphaned wishlist rows first
DELETE FROM public.wishlist
WHERE product_id NOT IN (SELECT id FROM public.products);

ALTER TABLE public.wishlist
  ADD CONSTRAINT fk_wishlist_product_id
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.cart_items
  ADD CONSTRAINT fk_cart_items_product_id
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
