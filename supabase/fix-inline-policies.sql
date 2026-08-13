-- ============================================================
-- Fix: Replace owns_business function with inline checks
-- This avoids all function overload / text=uuid casting issues
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Menu Uploads — inline checks (no function calls)
DROP POLICY IF EXISTS "upload_select" ON menu_uploads;
CREATE POLICY "upload_select" ON menu_uploads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_uploads.business_id AND businesses.owner_id = auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "upload_insert" ON menu_uploads;
CREATE POLICY "upload_insert" ON menu_uploads
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_uploads.business_id AND businesses.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "upload_update" ON menu_uploads;
CREATE POLICY "upload_update" ON menu_uploads
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_uploads.business_id AND businesses.owner_id = auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "upload_delete" ON menu_uploads;
CREATE POLICY "upload_delete" ON menu_uploads
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_uploads.business_id AND businesses.owner_id = auth.uid())
    OR is_admin()
  );

-- 2. Menu Categories — inline checks
DROP POLICY IF EXISTS "cat_select" ON menu_categories;
CREATE POLICY "cat_select" ON menu_categories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_categories.business_id AND businesses.owner_id = auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "cat_insert" ON menu_categories;
CREATE POLICY "cat_insert" ON menu_categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_categories.business_id AND businesses.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "cat_update" ON menu_categories;
CREATE POLICY "cat_update" ON menu_categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_categories.business_id AND businesses.owner_id = auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "cat_delete" ON menu_categories;
CREATE POLICY "cat_delete" ON menu_categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_categories.business_id AND businesses.owner_id = auth.uid())
    OR is_admin()
  );

-- 3. Menu Items — inline checks
DROP POLICY IF EXISTS "item_insert" ON menu_items;
CREATE POLICY "item_insert" ON menu_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_items.business_id AND businesses.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "item_update" ON menu_items;
CREATE POLICY "item_update" ON menu_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_items.business_id AND businesses.owner_id = auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "item_delete" ON menu_items;
CREATE POLICY "item_delete" ON menu_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_items.business_id AND businesses.owner_id = auth.uid())
    OR is_admin()
  );

-- 4. Verify
SELECT policyname, tablename, cmd FROM pg_policies WHERE tablename = 'menu_uploads' ORDER BY cmd;
