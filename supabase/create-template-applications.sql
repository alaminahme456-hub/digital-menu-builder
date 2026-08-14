-- Template Application Tracking Table
-- Stores a log of every template applied to a business's menu

CREATE TABLE IF NOT EXISTS template_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Only one active template per business at a time
  UNIQUE (business_id, template_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_template_applications_business_id
  ON template_applications(business_id);

-- RLS: Enable Row Level Security
ALTER TABLE template_applications ENABLE ROW LEVEL SECURITY;

-- RLS: Owners can read/write their own logs
CREATE POLICY "Owners can read own template logs"
  ON template_applications FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can insert own template logs"
  ON template_applications FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- RLS: Admins can read all
CREATE POLICY "Admins can read all template logs"
  ON template_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON TABLE template_applications IS 'Tracks which templates have been applied to each business menu';
