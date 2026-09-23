DROP POLICY IF EXISTS journal_images_public_read ON storage.objects;
CREATE POLICY journal_images_owner_read
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'journal-images'
  AND owner_id = (SELECT auth.uid()::text)
);