-- ═══════════════════════════════════════════════════════════════════════════
-- BIZFLIP MARKETPLACE — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- 1. DESIGNER APPLICATIONS
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS designer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  bio TEXT,
  country TEXT,
  specialties TEXT[] DEFAULT '{}',
  portfolio_link TEXT,
  social_links JSONB DEFAULT '{}',
  profile_image TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  review_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_designer_applications_user ON designer_applications(user_id);
CREATE INDEX idx_designer_applications_status ON designer_applications(status);
CREATE INDEX idx_designer_applications_username ON designer_applications(username);

-- ───────────────────────────────────────────────────────────────────────
-- 2. DESIGNERS
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS designers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  bio TEXT DEFAULT '',
  avatar TEXT,
  country TEXT,
  specialties TEXT[] DEFAULT '{}',
  portfolio_link TEXT,
  social_links JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  available_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  pending_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_templates INT NOT NULL DEFAULT 0,
  total_uses INT NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_designers_user ON designers(user_id);
CREATE INDEX idx_designers_username ON designers(username);
CREATE INDEX idx_designers_status ON designers(status);

-- ───────────────────────────────────────────────────────────────────────
-- 3. MARKETPLACE CATEGORIES
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed categories
INSERT INTO marketplace_categories (name, slug, description, icon, sort_order) VALUES
  ('Luxury', 'luxury', 'Premium and high-end designs', 'gem', 1),
  ('Minimal', 'minimal', 'Clean and simple designs', 'circle', 2),
  ('Modern', 'modern', 'Contemporary and trendy designs', 'zap', 3),
  ('Editorial', 'editorial', 'Magazine-style layouts', 'book-open', 4),
  ('Classic', 'classic', 'Traditional and timeless designs', 'crown', 5),
  ('Creative', 'creative', 'Bold and expressive designs', 'sparkles', 6)
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────
-- 4. MARKETPLACE TEMPLATES
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID NOT NULL REFERENCES designers(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL CHECK (template_type IN ('book_cover', 'menu')),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  preview_images TEXT[] DEFAULT '{}',
  template_configuration JSONB NOT NULL DEFAULT '{}',
  recommended_for TEXT[] DEFAULT '{}',
  design_style TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'hidden', 'removed')),
  featured BOOLEAN NOT NULL DEFAULT false,
  license_type TEXT NOT NULL DEFAULT 'standard' CHECK (license_type IN ('standard', 'extended')),
  version INT NOT NULL DEFAULT 1,
  total_views INT NOT NULL DEFAULT 0,
  total_previews INT NOT NULL DEFAULT 0,
  total_applications INT NOT NULL DEFAULT 0,
  total_uses INT NOT NULL DEFAULT 0,
  total_premium_uses INT NOT NULL DEFAULT 0,
  total_favorites INT NOT NULL DEFAULT 0,
  rating_sum INT NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketplace_templates_designer ON marketplace_templates(designer_id);
CREATE INDEX idx_marketplace_templates_type ON marketplace_templates(template_type);
CREATE INDEX idx_marketplace_templates_status ON marketplace_templates(status);
CREATE INDEX idx_marketplace_templates_category ON marketplace_templates(category);
CREATE INDEX idx_marketplace_templates_featured ON marketplace_templates(featured) WHERE featured = true;

-- ───────────────────────────────────────────────────────────────────────
-- 5. TEMPLATE USAGE EVENTS
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS template_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  designer_id UUID NOT NULL REFERENCES designers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('preview', 'application', 'use')),
  qualifies_for_earnings BOOLEAN NOT NULL DEFAULT false,
  earnings_amount DECIMAL(10,2) DEFAULT 0,
  subscription_status TEXT DEFAULT 'free',
  event_id TEXT NOT NULL UNIQUE, -- unique event to prevent duplicate earnings
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_events_template ON template_usage_events(template_id);
CREATE INDEX idx_usage_events_designer ON template_usage_events(designer_id);
CREATE INDEX idx_usage_events_business ON template_usage_events(business_id);
CREATE INDEX idx_usage_events_user ON template_usage_events(user_id);
CREATE INDEX idx_usage_events_event_id ON template_usage_events(event_id);
CREATE INDEX idx_usage_events_created ON template_usage_events(created_at);

-- ───────────────────────────────────────────────────────────────────────
-- 6. DESIGNER EARNINGS
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS designer_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID NOT NULL REFERENCES designers(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  usage_event_id UUID NOT NULL UNIQUE REFERENCES template_usage_events(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'reversed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_earnings_designer ON designer_earnings(designer_id);
CREATE INDEX idx_earnings_status ON designer_earnings(status);
CREATE INDEX idx_earnings_template ON designer_earnings(template_id);

-- ───────────────────────────────────────────────────────────────────────
-- 7. DESIGNER WITHDRAWALS
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS designer_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID NOT NULL REFERENCES designers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'rejected', 'cancelled')),
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_withdrawals_designer ON designer_withdrawals(designer_id);
CREATE INDEX idx_withdrawals_status ON designer_withdrawals(status);

-- ───────────────────────────────────────────────────────────────────────
-- 8. TEMPLATE FAVORITES
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS template_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, template_id)
);

CREATE INDEX idx_favorites_user ON template_favorites(user_id);
CREATE INDEX idx_favorites_template ON template_favorites(template_id);

-- ───────────────────────────────────────────────────────────────────────
-- 9. TEMPLATE RATINGS
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS template_ratings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, template_id)
);

CREATE INDEX idx_ratings_template ON template_ratings(template_id);

-- ───────────────────────────────────────────────────────────────────────
-- 10. MARKETPLACE CONFIGURATION
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed config
INSERT INTO marketplace_config (key, value, description) VALUES
  ('designer_share_pct', '70', 'Percentage of revenue going to designer'),
  ('platform_share_pct', '30', 'Percentage of revenue going to BizFlip'),
  ('earning_per_premium_use', '350', 'Amount earned per qualifying premium use (in minor units)'),
  ('currency', 'NGN', 'Currency for designer earnings'),
  ('min_withdrawal', '5000', 'Minimum withdrawal amount in minor units'),
  ('auto_approve_designers', 'false', 'Whether to auto-approve new designer applications')
ON CONFLICT (key) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────
-- 11. TEMPLATE REPORTS
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS template_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_template ON template_reports(template_id);
CREATE INDEX idx_reports_status ON template_reports(status);

-- ───────────────────────────────────────────────────────────────────────
-- 12. MARKETPLACE TEMPLATE APPLICATIONS (which business uses which template)
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_template_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL CHECK (template_type IN ('book_cover', 'menu')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, template_id, template_type)
);

CREATE INDEX idx_marketplace_applications_business ON marketplace_template_applications(business_id);
CREATE INDEX idx_marketplace_applications_template ON marketplace_template_applications(template_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper function (should exist, but ensure it does)
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: check if user owns a designer profile
CREATE OR REPLACE FUNCTION is_designer(designer_uid UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM designers WHERE id = designer_uid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─── designer_applications ───
ALTER TABLE designer_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read own application"
  ON designer_applications FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Users can create own application"
  ON designer_applications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own application"
  ON designer_applications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can update any application"
  ON designer_applications FOR UPDATE USING (is_admin());

-- ─── designers ───
ALTER TABLE designers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for active designers"
  ON designers FOR SELECT USING (status = 'active');
CREATE POLICY "Designers read own profile"
  ON designers FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Designers update own profile"
  ON designers FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Admins manage designers"
  ON designers FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins update designers"
  ON designers FOR UPDATE USING (is_admin());
CREATE POLICY "Admins delete designers"
  ON designers FOR DELETE USING (is_admin());

-- ─── marketplace_categories ───
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories"
  ON marketplace_categories FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admins manage categories"
  ON marketplace_categories FOR ALL USING (is_admin());

-- ─── marketplace_templates ───
ALTER TABLE marketplace_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published templates"
  ON marketplace_templates FOR SELECT USING (status = 'published' OR is_designer(designer_id) OR is_admin());
CREATE POLICY "Designers manage own templates"
  ON marketplace_templates FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM designers WHERE id = designer_id AND user_id = auth.uid())
  );
CREATE POLICY "Designers update own templates"
  ON marketplace_templates FOR UPDATE USING (
    EXISTS (SELECT 1 FROM designers WHERE id = designer_id AND user_id = auth.uid()) OR is_admin()
  );
CREATE POLICY "Admins manage all templates"
  ON marketplace_templates FOR ALL USING (is_admin());

-- ─── template_usage_events ───
ALTER TABLE template_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Designers read own events"
  ON template_usage_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM designers WHERE id = designer_id AND user_id = auth.uid()) OR is_admin()
  );
CREATE POLICY "System inserts events"
  ON template_usage_events FOR INSERT WITH CHECK (is_admin() OR true);

-- ─── designer_earnings ───
ALTER TABLE designer_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Designers read own earnings"
  ON designer_earnings FOR SELECT USING (
    EXISTS (SELECT 1 FROM designers WHERE id = designer_id AND user_id = auth.uid()) OR is_admin()
  );
CREATE POLICY "System manages earnings"
  ON designer_earnings FOR ALL USING (is_admin());

-- ─── designer_withdrawals ───
ALTER TABLE designer_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Designers read own withdrawals"
  ON designer_withdrawals FOR SELECT USING (
    EXISTS (SELECT 1 FROM designers WHERE id = designer_id AND user_id = auth.uid()) OR is_admin()
  );
CREATE POLICY "Designers create withdrawals"
  ON designer_withdrawals FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM designers WHERE id = designer_id AND user_id = auth.uid())
  );
CREATE POLICY "Admins manage withdrawals"
  ON designer_withdrawals FOR UPDATE USING (is_admin());

-- ─── template_favorites ───
ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites"
  ON template_favorites FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Anyone can read favorites count"
  ON template_favorites FOR SELECT USING (true);

-- ─── template_ratings ───
ALTER TABLE template_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ratings"
  ON template_ratings FOR SELECT USING (true);
CREATE POLICY "Users manage own ratings"
  ON template_ratings FOR ALL USING (user_id = auth.uid());

-- ─── marketplace_config ───
ALTER TABLE marketplace_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage config"
  ON marketplace_config FOR ALL USING (is_admin());
CREATE POLICY "Designers read config"
  ON marketplace_config FOR SELECT USING (is_admin() OR true);

-- ─── template_reports ───
ALTER TABLE template_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read reports"
  ON template_reports FOR SELECT USING (is_admin());
CREATE POLICY "Users can create reports"
  ON template_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Admins manage reports"
  ON template_reports FOR UPDATE USING (is_admin());

-- ─── marketplace_template_applications ───
ALTER TABLE marketplace_template_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own business applications"
  ON marketplace_template_applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()) OR is_admin()
  );
CREATE POLICY "Users create applications"
  ON marketplace_template_applications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-create designer from approved application
CREATE OR REPLACE FUNCTION approve_designer_application()
RETURNS TRIGGER AS $$
DECLARE
  v_designer_id UUID;
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Check if designer already exists
    SELECT id INTO v_designer_id FROM designers WHERE user_id = NEW.user_id;
    IF v_designer_id IS NULL THEN
      INSERT INTO designers (user_id, display_name, username, bio, country, specialties, portfolio_link, social_links, profile_image, status)
      VALUES (
        NEW.user_id, NEW.display_name, NEW.username,
        COALESCE(NEW.bio, ''), NEW.country, NEW.specialties,
        NEW.portfolio_link, NEW.social_links, NEW.profile_image, 'active'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_approve_designer_application
  AFTER UPDATE ON designer_applications
  FOR EACH ROW EXECUTE FUNCTION approve_designer_application();

-- Update template stats on favorite toggle
CREATE OR REPLACE FUNCTION update_template_fav_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_templates SET total_favorites = total_favorites + 1 WHERE id = NEW.template_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_templates SET total_favorites = total_favorites - 1 WHERE id = OLD.template_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_template_fav_count
  AFTER INSERT OR DELETE ON template_favorites
  FOR EACH ROW EXECUTE FUNCTION update_template_fav_count();

-- Update template stats on rating
CREATE OR REPLACE FUNCTION update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_templates
    SET rating_sum = rating_sum + NEW.rating,
        rating_count = rating_count + 1
    WHERE id = NEW.template_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE marketplace_templates
    SET rating_sum = rating_sum - OLD.rating + NEW.rating
    WHERE id = NEW.template_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_templates
    SET rating_sum = rating_sum - OLD.rating,
        rating_count = rating_count - 1
    WHERE id = OLD.template_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_template_rating
  AFTER INSERT OR UPDATE OR DELETE ON template_ratings
  FOR EACH ROW EXECUTE FUNCTION update_template_rating();
