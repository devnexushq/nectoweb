-- ==============================================================================
-- MIGRATION: Product Images Storage Bucket and RLS Policies
-- Enables shop owners to upload and manage product images
-- ==============================================================================

-- 1. Create the product-images bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. Allow public read access to product images without authentication
DROP POLICY IF EXISTS "Public Access to product-images" ON storage.objects;
CREATE POLICY "Public Access to product-images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

-- 3. Allow uploads into the product-images bucket
DROP POLICY IF EXISTS "Allow uploads to product-images" ON storage.objects;
CREATE POLICY "Allow uploads to product-images"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'product-images');

-- 4. Allow updates to images in product-images bucket
DROP POLICY IF EXISTS "Allow updates to product-images" ON storage.objects;
CREATE POLICY "Allow updates to product-images"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

-- 5. Allow deleting images in product-images bucket
DROP POLICY IF EXISTS "Allow deletes to product-images" ON storage.objects;
CREATE POLICY "Allow deletes to product-images"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'product-images');
