-- ============================================================
-- Fix: Add public read policies for published businesses
-- This allows anonymous users (QR code scanners) to view
-- published menus without authentication.
-- ============================================================

-- 1. Businesses: Allow anon to read published businesses
DROP POLICY IF EXISTS "biz_select_own" ON businesses;
CREATE POLICY "biz_select_own" ON businesses
  FOR SELECT USING (owner_id = auth.uid() OR is_admin() OR (status = 'published'));

-- 2. Menu Categories: Allow anon to read categories for published businesses
DROP POLICY IF EXISTS "cat_select" ON menu_categories;
CREATE POLICY "cat_select" ON menu_categories
  FOR SELECT USING (
    owns_business(business_id)
    OR is_admin()
    OR EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_categories.business_id AND businesses.status = 'published')
  );

-- 3. Menu Uploads: Allow anon to read uploads for published businesses
DROP POLICY IF EXISTS "upload_select" ON menu_uploads;
CREATE POLICY "upload_select" ON menu_uploads
  FOR SELECT USING (
    owns_business(business_id)
    OR is_admin()
    OR EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_uploads.business_id AND businesses.status = 'published')
  );
