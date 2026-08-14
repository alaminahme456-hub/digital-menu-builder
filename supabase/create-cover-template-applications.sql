-- Cover Template Application Tracking Table
-- Stores cover template selection and customization per business

CREATE TABLE IF NOT EXISTS cover_template_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  cover_template_id TEXT NOT NULL,
  cover_image TEXT,
  cover_tagline TEXT DEFAULT '',
  cover_accent TEXT DEFAULT '#C9A84C',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cover_template_applications_business_id
  ON cover_template_applications(business_id);

-- RLS: Enable Row Level Security
ALTER TABLE cover_template_applications ENABLE ROW LEVEL SECURITY;

-- RLS: Owners can read/write their own cover selections
CREATE POLICY "Owners can read own cover templates"
  ON cover_template_applications FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can insert own cover templates"
  ON cover_template_applications FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can update own cover templates"
  ON cover_template_applications FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- RLS: Public read for published businesses (customers need to see the cover)
CREATE POLICY "Public can read published covers"
  ON cover_template_applications FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE status = 'published'
    )
  );

-- RLS: Admins can read all
CREATE POLICY "Admins can read all cover templates"
  ON cover_template_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON TABLE cover_template_applications IS 'Tracks which cover templates are applied to each business digital book';
