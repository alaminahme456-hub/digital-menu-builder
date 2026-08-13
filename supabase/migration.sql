-- ============================================================
-- Digital Menu Builder — Supabase Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Profiles table (linked to Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  email_verified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      NULL
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'role',
      'user'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Businesses
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  logo TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  opening_hours TEXT,
  description TEXT,
  primary_color TEXT DEFAULT '#10b981',
  secondary_color TEXT DEFAULT '#059669',
  font_family TEXT DEFAULT 'inter',
  template_name TEXT DEFAULT 'modern',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unpublished')),
  whatsapp_order BOOLEAN DEFAULT true,
  seo_enabled BOOLEAN DEFAULT true,
  flipbook_enabled BOOLEAN DEFAULT true,
  flipbook_anim_enabled BOOLEAN DEFAULT true,
  flipbook_anim_speed TEXT DEFAULT 'medium' CHECK (flipbook_anim_speed IN ('slow', 'medium', 'fast')),
  flipbook_page_numbers BOOLEAN DEFAULT true,
  flipbook_swipe_nav BOOLEAN DEFAULT true,
  flipbook_sound_effects BOOLEAN DEFAULT false,
  flipbook_fullscreen BOOLEAN DEFAULT true,
  flipbook_interactions BOOLEAN DEFAULT true,
  basket_enabled BOOLEAN DEFAULT true,
  show_quantity_selector BOOLEAN DEFAULT true,
  show_order_button BOOLEAN DEFAULT true,
  whatsapp_greeting TEXT DEFAULT 'Hello, I would like to place an order:',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Menu Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Menu Items
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DOUBLE PRECISION NOT NULL,
  image TEXT,
  sort_order INT DEFAULT 0,
  available BOOLEAN DEFAULT true,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Menu Uploads
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_size INT,
  file_type TEXT,
  url TEXT NOT NULL,
  published BOOLEAN DEFAULT false,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'qr_scan', 'item_view')),
  menu_item_id UUID,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. AI Scan Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_scan_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  items_detected INT DEFAULT 0,
  items_saved INT DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Templates
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'businesses', 'menu_categories', 'menu_items',
    'menu_uploads', 'ai_scan_logs', 'templates'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
       CREATE TRIGGER update_%s_updated_at
         BEFORE UPDATE ON %s
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      t, t, t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- Enable Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================

-- Helper: admin check function
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: business owner check
CREATE OR REPLACE FUNCTION owns_business(biz_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM businesses WHERE id = biz_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_insert_auto" ON profiles;
CREATE POLICY "profiles_insert_auto" ON profiles
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (is_admin());

-- Businesses
DROP POLICY IF EXISTS "biz_select_own" ON businesses;
CREATE POLICY "biz_select_own" ON businesses
  FOR SELECT USING (owner_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "biz_insert_own" ON businesses;
CREATE POLICY "biz_insert_own" ON businesses
  FOR INSERT WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "biz_update_own" ON businesses;
CREATE POLICY "biz_update_own" ON businesses
  FOR UPDATE USING (owner_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "biz_delete_own" ON businesses;
CREATE POLICY "biz_delete_own" ON businesses
  FOR DELETE USING (owner_id = auth.uid() OR is_admin());

-- Menu Categories
DROP POLICY IF EXISTS "cat_select" ON menu_categories;
CREATE POLICY "cat_select" ON menu_categories
  FOR SELECT USING (owns_business(business_id) OR is_admin());
DROP POLICY IF EXISTS "cat_insert" ON menu_categories;
CREATE POLICY "cat_insert" ON menu_categories
  FOR INSERT WITH CHECK (owns_business(business_id));
DROP POLICY IF EXISTS "cat_update" ON menu_categories;
CREATE POLICY "cat_update" ON menu_categories
  FOR UPDATE USING (owns_business(business_id) OR is_admin());
DROP POLICY IF EXISTS "cat_delete" ON menu_categories;
CREATE POLICY "cat_delete" ON menu_categories
  FOR DELETE USING (owns_business(business_id) OR is_admin());

-- Menu Items — public read for menu viewing
DROP POLICY IF EXISTS "item_select" ON menu_items;
CREATE POLICY "item_select" ON menu_items
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "item_insert" ON menu_items;
CREATE POLICY "item_insert" ON menu_items
  FOR INSERT WITH CHECK (owns_business(business_id));
DROP POLICY IF EXISTS "item_update" ON menu_items;
CREATE POLICY "item_update" ON menu_items
  FOR UPDATE USING (owns_business(business_id) OR is_admin());
DROP POLICY IF EXISTS "item_delete" ON menu_items;
CREATE POLICY "item_delete" ON menu_items
  FOR DELETE USING (owns_business(business_id) OR is_admin());

-- Menu Uploads
DROP POLICY IF EXISTS "upload_select" ON menu_uploads;
CREATE POLICY "upload_select" ON menu_uploads
  FOR SELECT USING (owns_business(business_id) OR is_admin());
DROP POLICY IF EXISTS "upload_insert" ON menu_uploads;
CREATE POLICY "upload_insert" ON menu_uploads
  FOR INSERT WITH CHECK (owns_business(business_id));
DROP POLICY IF EXISTS "upload_delete" ON menu_uploads;
CREATE POLICY "upload_delete" ON menu_uploads
  FOR DELETE USING (owns_business(business_id) OR is_admin());

-- Analytics — public insert (for tracking), selective read
DROP POLICY IF EXISTS "analytics_select" ON analytics;
CREATE POLICY "analytics_select" ON analytics
  FOR SELECT USING (owns_business(business_id) OR is_admin());
DROP POLICY IF EXISTS "analytics_insert" ON analytics;
CREATE POLICY "analytics_insert" ON analytics
  FOR INSERT WITH CHECK (true);

-- AI Scan Logs
DROP POLICY IF EXISTS "scan_select" ON ai_scan_logs;
CREATE POLICY "scan_select" ON ai_scan_logs
  FOR SELECT USING (owns_business(business_id));
DROP POLICY IF EXISTS "scan_insert" ON ai_scan_logs;
CREATE POLICY "scan_insert" ON ai_scan_logs
  FOR INSERT WITH CHECK (owns_business(business_id));

-- Templates — public read
DROP POLICY IF EXISTS "tmpl_select" ON templates;
CREATE POLICY "tmpl_select" ON templates
  FOR SELECT USING (true);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_categories_biz ON menu_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_items_biz ON menu_items(business_id);
CREATE INDEX IF NOT EXISTS idx_items_cat ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_analytics_biz ON analytics(business_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_uploads_biz ON menu_uploads(business_id);

-- ============================================================
-- Insert default templates
-- ============================================================
INSERT INTO templates (name, label, description) VALUES
  ('modern', 'Modern', 'Clean and contemporary design'),
  ('classic', 'Classic Restaurant', 'Traditional elegant styling'),
  ('luxury', 'Luxury', 'Premium gold and dark theme'),
  ('minimal', 'Minimal', 'Whitespace-focused simplicity'),
  ('fastfood', 'Fast Food', 'Bold and vibrant fast food style'),
  ('cafe', 'Café', 'Warm and cozy café atmosphere'),
  ('pizza', 'Pizza', 'Italian-inspired pizza menu'),
  ('dark', 'Dark Premium', 'Sleek dark theme with accent colors'),
  ('colorful', 'Colorful', 'Fun and vibrant multi-color design'),
  ('elegant', 'Elegant', 'Sophisticated and refined look')
ON CONFLICT (name) DO NOTHING;
