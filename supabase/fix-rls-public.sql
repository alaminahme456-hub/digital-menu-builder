-- ============================================================
-- Definitive fix: RLS policies + helper functions
--
-- Handles the case where businesses.id may be TEXT or UUID.
-- Uses id::text for safe comparison regardless of column type.
--
-- Run this ENTIRE script in Supabase SQL Editor.
-- ============================================================

-- 1. Fix owns_business to always compare as TEXT (works for both UUID and TEXT columns)
CREATE OR REPLACE FUNCTION owns_business(biz_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM businesses WHERE id::text = biz_id::text AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION owns_business(biz_id TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM businesses WHERE id::text = biz_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Businesses: Allow anon to read published businesses
DROP POLICY IF EXISTS "biz_select_own" ON businesses;
CREATE POLICY "biz_select_own" ON businesses
  FOR SELECT USING (owner_id = auth.uid() OR is_admin() OR (status = 'published'));

-- 3. Menu Categories
DROP POLICY IF EXISTS "cat_select" ON menu_categories;
CREATE POLICY "cat_select" ON menu_categories
  FOR SELECT USING (
    owns_business(business_id::text)
    OR is_admin()
    OR EXISTS (SELECT 1 FROM businesses WHERE businesses.id::text = menu_categories.business_id::text AND businesses.status = 'published')
  );
DROP POLICY IF EXISTS "cat_insert" ON menu_categories;
CREATE POLICY "cat_insert" ON menu_categories
  FOR INSERT WITH CHECK (owns_business(business_id::text));
DROP POLICY IF EXISTS "cat_update" ON menu_categories;
CREATE POLICY "cat_update" ON menu_categories
  FOR UPDATE USING (owns_business(business_id::text) OR is_admin());
DROP POLICY IF EXISTS "cat_delete" ON menu_categories;
CREATE POLICY "cat_delete" ON menu_categories
  FOR DELETE USING (owns_business(business_id::text) OR is_admin());

-- 4. Menu Items
DROP POLICY IF EXISTS "item_select" ON menu_items;
CREATE POLICY "item_select" ON menu_items
  FOR SELECT USING (
    owns_business(business_id::text)
    OR is_admin()
    OR EXISTS (SELECT 1 FROM businesses WHERE businesses.id::text = menu_items.business_id::text AND businesses.status = 'published')
  );
DROP POLICY IF EXISTS "item_insert" ON menu_items;
CREATE POLICY "item_insert" ON menu_items
  FOR INSERT WITH CHECK (owns_business(business_id::text));
DROP POLICY IF EXISTS "item_update" ON menu_items;
CREATE POLICY "item_update" ON menu_items
  FOR UPDATE USING (owns_business(business_id::text) OR is_admin());
DROP POLICY IF EXISTS "item_delete" ON menu_items;
CREATE POLICY "item_delete" ON menu_items
  FOR DELETE USING (owns_business(business_id::text) OR is_admin());

-- 5. Menu Uploads
DROP POLICY IF EXISTS "upload_select" ON menu_uploads;
CREATE POLICY "upload_select" ON menu_uploads
  FOR SELECT USING (
    owns_business(business_id::text)
    OR is_admin()
    OR EXISTS (SELECT 1 FROM businesses WHERE businesses.id::text = menu_uploads.business_id::text AND businesses.status = 'published')
  );
DROP POLICY IF EXISTS "upload_insert" ON menu_uploads;
CREATE POLICY "upload_insert" ON menu_uploads
  FOR INSERT WITH CHECK (owns_business(business_id::text));
DROP POLICY IF EXISTS "upload_delete" ON menu_uploads;
CREATE POLICY "upload_delete" ON menu_uploads
  FOR DELETE USING (owns_business(business_id::text) OR is_admin());

-- 6. Analytics
DROP POLICY IF EXISTS "analytics_select" ON analytics;
CREATE POLICY "analytics_select" ON analytics
  FOR SELECT USING (
    owns_business(business_id::text)
    OR is_admin()
    OR EXISTS (SELECT 1 FROM businesses WHERE businesses.id::text = analytics.business_id::text AND businesses.status = 'published')
  );
DROP POLICY IF EXISTS "analytics_insert" ON analytics;
CREATE POLICY "analytics_insert" ON analytics
  FOR INSERT WITH CHECK (true);

-- 7. get_public_menu function (SECURITY DEFINER — bypasses RLS entirely)
CREATE OR REPLACE FUNCTION get_public_menu(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
  v_biz_id TEXT;
  v_business JSON;
  v_categories JSON;
  v_items JSON;
  v_uploads JSON;
BEGIN
  SELECT id::TEXT INTO v_biz_id FROM businesses WHERE slug = p_slug LIMIT 1;
  IF v_biz_id IS NULL THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  SELECT to_jsonb(b) INTO v_business FROM businesses b WHERE b.id::text = v_biz_id;
  SELECT json_agg(to_jsonb(c) ORDER BY c.sort_order ASC) INTO v_categories
    FROM menu_categories c WHERE c.business_id::text = v_biz_id;
  SELECT json_agg(to_jsonb(i) ORDER BY i.sort_order ASC) INTO v_items
    FROM menu_items i WHERE i.business_id::text = v_biz_id;
  SELECT json_agg(to_jsonb(u) ORDER BY u.created_at DESC) INTO v_uploads
    FROM menu_uploads u WHERE u.business_id::text = v_biz_id AND u.published = true;

  RETURN json_build_object(
    'business', v_business,
    'categories', COALESCE(v_categories, '[]'::json),
    'items', COALESCE(v_items, '[]'::json),
    'uploads', COALESCE(v_uploads, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
