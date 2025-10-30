-- Fix storage RLS policies for learning bucket to allow admin uploads
CREATE POLICY "Admins can upload to learning bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'learning' AND
  is_admin()
);

CREATE POLICY "Admins can update learning bucket files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'learning' AND
  is_admin()
);

CREATE POLICY "Admins can delete from learning bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'learning' AND
  is_admin()
);

CREATE POLICY "Everyone can view learning bucket files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'learning');