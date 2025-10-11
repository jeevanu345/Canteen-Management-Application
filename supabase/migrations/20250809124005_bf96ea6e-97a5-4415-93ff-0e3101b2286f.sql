-- Create a public storage bucket for menu item images and secure RLS policies (retry with correct catalog columns)

-- 1) Ensure bucket 'menu-images' exists and is public
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'menu-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('menu-images', 'menu-images', true);
  END IF;
END $$;

-- 2) Recreate policies safely (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view menu images'
  ) THEN
    DROP POLICY "Public can view menu images" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Staff can upload menu images'
  ) THEN
    DROP POLICY "Staff can upload menu images" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Staff can update own menu images'
  ) THEN
    DROP POLICY "Staff can update own menu images" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Staff can delete own menu images'
  ) THEN
    DROP POLICY "Staff can delete own menu images" ON storage.objects;
  END IF;
END $$;

-- 3) Policies for bucket access
-- Public read access for menu images
CREATE POLICY "Public can view menu images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'menu-images');

-- Only staff can upload to their own folder (path starts with their user id)
CREATE POLICY "Staff can upload menu images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images'
  AND public.get_user_role(auth.uid()) = 'staff'::public.user_role
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Only staff can update files they own within the bucket
CREATE POLICY "Staff can update own menu images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'menu-images'
  AND public.get_user_role(auth.uid()) = 'staff'::public.user_role
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'menu-images'
  AND public.get_user_role(auth.uid()) = 'staff'::public.user_role
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Only staff can delete files they own within the bucket
CREATE POLICY "Staff can delete own menu images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'menu-images'
  AND public.get_user_role(auth.uid()) = 'staff'::public.user_role
  AND auth.uid()::text = (storage.foldername(name))[1]
);
