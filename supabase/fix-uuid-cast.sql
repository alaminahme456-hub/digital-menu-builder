-- ============================================================
-- Fix: UUID cast issue in menu_uploads RLS policies
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Recreate owns_business with TEXT overload (auto-casts to UUID)
CREATE OR REPLACE FUNCTION owns_business(biz_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM businesses WHERE id = biz_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION owns_business(biz_id TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM businesses WHERE id = biz_id::uuid AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Recreate menu_uploads RLS policies with explicit ::uuid cast
DROP POLICY IF EXISTS "upload_select" ON menu_uploads;
CREATE POLICY "upload_select" ON menu_uploads
  FOR SELECT USING (owns_business(business_id::text) OR is_admin());

DROP POLICY IF EXISTS "upload_insert" ON menu_uploads;
CREATE POLICY "upload_insert" ON menu_uploads
  FOR INSERT WITH CHECK (owns_business(business_id::text));

DROP POLICY IF EXISTS "upload_update" ON menu_uploads;
CREATE POLICY "upload_update" ON menu_uploads
  FOR UPDATE USING (owns_business(business_id::text) OR is_admin());

DROP POLICY IF EXISTS "upload_delete" ON menu_uploads;
CREATE POLICY "upload_delete" ON menu_uploads
  FOR DELETE USING (owns_business(business_id::text) OR is_admin());

-- 3. Also fix menu_categories and menu_items policies with explicit cast
DROP POLICY IF EXISTS "cat_select" ON menu_categories;
CREATE POLICY "cat_select" ON menu_categories
  FOR SELECT USING (owns_business(business_id::text) OR is_admin());

DROP POLICY IF EXISTS "cat_insert" ON menu_categories;
CREATE POLICY "cat_insert" ON menu_categories
  FOR INSERT WITH CHECK (owns_business(business_id::text));

DROP POLICY IF EXISTS "cat_update" ON menu_categories;
CREATE POLICY "cat_update" ON menu_categories
  FOR UPDATE USING (owns_business(business_id::text) OR is_admin());

DROP POLICY IF EXISTS "cat_delete" ON menu_categories;
CREATE POLICY "cat_delete" ON menu_categories
  FOR DELETE USING (owns_business(business_id::text) OR is_admin());

DROP POLICY IF EXISTS "item_insert" ON menu_items;
CREATE POLICY "item_insert" ON menu_items
  FOR INSERT WITH CHECK (owns_business(business_id::text));

DROP POLICY IF EXISTS "item_update" ON menu_items;
CREATE POLICY "item_update" ON menu_items
  FOR UPDATE USING (owns_business(business_id::text) OR is_admin());

DROP POLICY IF EXISTS "item_delete" ON menu_items;
CREATE POLICY "item_delete" ON menu_items
  FOR DELETE USING (owns_business(business_id::text) OR is_admin());
