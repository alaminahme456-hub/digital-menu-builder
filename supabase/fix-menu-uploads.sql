-- ============================================================
-- Fix: Menu Uploads RLS + Storage Policies
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add missing UPDATE policy for menu_uploads (needed for publish toggle)
DROP POLICY IF EXISTS "upload_update" ON menu_uploads;
CREATE POLICY "upload_update" ON menu_uploads
  FOR UPDATE USING (owns_business(business_id) OR is_admin());

-- 2. Ensure owns_business function exists for both UUID and TEXT
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

-- 3. Storage policies for menu-files bucket (authenticated users can upload)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('menu-files', 'menu-files', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "menu_files_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'menu-files'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "menu_files_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-files');

CREATE POLICY "menu_files_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'menu-files'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- 4. Storage policies for menu-images bucket (authenticated users can upload)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('menu-images', 'menu-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "menu_images_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'menu-images'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "menu_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "menu_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'menu-images'
    AND auth.uid() IS NOT NULL
  );

-- 5. Verify policies
SELECT policyname, tablename, cmd
FROM pg_policies
WHERE tablename = 'menu_uploads'
ORDER BY cmd;
