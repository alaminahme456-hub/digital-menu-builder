-- ============================================================
-- Fix: Enable public menu access for QR code scanners
-- 
-- This script does TWO things:
--   1. Creates a SECURITY DEFINER function that bypasses RLS
--      to fetch menu data for published businesses
--   2. Updates RLS policies to allow anon reads for published businesses
--
-- Run this ENTIRE script in Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- PART 1: SECURITY DEFINER function (bypasses RLS completely)
-- The server component calls this via supabase.rpc()
-- ============================================================

CREATE OR REPLACE FUNCTION get_public_menu(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
  v_biz_id TEXT;
  v_business JSON;
  v_categories JSON;
  v_items JSON;
  v_uploads JSON;
BEGIN
  -- Fetch business id first (TEXT type for compatibility)
  SELECT id::TEXT INTO v_biz_id
  FROM businesses
  WHERE slug = p_slug
  LIMIT 1;

  IF v_biz_id IS NULL THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  -- Fetch business data
  SELECT to_jsonb(b) INTO v_business
  FROM businesses b
  WHERE b.id = v_biz_id::uuid;

  -- Fetch categories
  SELECT json_agg(to_jsonb(c) ORDER BY c.sort_order ASC) INTO v_categories
  FROM menu_categories c
  WHERE c.business_id = v_biz_id::uuid;

  -- Fetch items
  SELECT json_agg(to_jsonb(i) ORDER BY i.sort_order ASC) INTO v_items
  FROM menu_items i
  WHERE i.business_id = v_biz_id::uuid;

  -- Fetch published uploads
  SELECT json_agg(to_jsonb(u) ORDER BY u.created_at DESC) INTO v_uploads
  FROM menu_uploads u
  WHERE u.business_id = v_biz_id::uuid AND u.published = true;

  -- Combine results
  RETURN json_build_object(
    'business', v_business,
    'categories', COALESCE(v_categories, '[]'::json),
    'items', COALESCE(v_items, '[]'::json),
    'uploads', COALESCE(v_uploads, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- PART 2: Update RLS policies for defense-in-depth
-- Uses owns_business(business_id::text) for UUID cast safety
-- ============================================================

-- 1. Businesses: Allow anon to read published businesses
DROP POLICY IF EXISTS "biz_select_own" ON businesses;
CREATE POLICY "biz_select_own" ON businesses
  FOR SELECT USING (owner_id = auth.uid() OR is_admin() OR (status = 'published'));

-- 2. Menu Categories: Allow anon to read for published businesses
DROP POLICY IF EXISTS "cat_select" ON menu_categories;
CREATE POLICY "cat_select" ON menu_categories
  FOR SELECT USING (
    owns_business(business_id::text)
    OR is_admin()
    OR EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_categories.business_id::uuid AND businesses.status = 'published')
  );

-- 3. Menu Items: Allow anon to read for published businesses
DROP POLICY IF EXISTS "item_select" ON menu_items;
CREATE POLICY "item_select" ON menu_items
  FOR SELECT USING (
    owns_business(business_id::text)
    OR is_admin()
    OR EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_items.business_id::uuid AND businesses.status = 'published')
  );

-- 4. Menu Uploads: Allow anon to read for published businesses
DROP POLICY IF EXISTS "upload_select" ON menu_uploads;
CREATE POLICY "upload_select" ON menu_uploads
  FOR SELECT USING (
    owns_business(business_id::text)
    OR is_admin()
    OR EXISTS (SELECT 1 FROM businesses WHERE businesses.id = menu_uploads.business_id::uuid AND businesses.status = 'published')
  );

-- 5. Analytics: Allow anon inserts for view tracking
DROP POLICY IF EXISTS "analytics_insert" ON analytics;
CREATE POLICY "analytics_insert" ON analytics
  FOR INSERT WITH CHECK (true);

-- 6. Analytics: Allow anon reads for published businesses
DROP POLICY IF EXISTS "analytics_select" ON analytics;
CREATE POLICY "analytics_select" ON analytics
  FOR SELECT USING (
    owns_business(business_id::text)
    OR is_admin()
    OR EXISTS (SELECT 1 FROM businesses WHERE businesses.id = analytics.business_id::uuid AND businesses.status = 'published')
  );
