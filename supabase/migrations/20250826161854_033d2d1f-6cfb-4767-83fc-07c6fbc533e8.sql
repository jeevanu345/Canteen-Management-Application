-- Allow staff to view payment screenshots for their canteen orders
CREATE POLICY "Staff can view payment screenshots for their canteen orders"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-screenshots' AND
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.canteens c ON o.canteen_id = c.id
    WHERE c.staff_id = auth.uid()
    AND o.payment_screenshot_url = name
  )
);

-- Allow anyone to view canteen assets (for QR codes, logos, etc.)
CREATE POLICY "Anyone can view canteen assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'canteen-assets');

-- Allow staff to upload to their canteen assets folder
CREATE POLICY "Staff can upload canteen assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'canteen-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow staff to update their canteen assets
CREATE POLICY "Staff can update canteen assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'canteen-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow staff to delete their canteen assets
CREATE POLICY "Staff can delete canteen assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'canteen-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);