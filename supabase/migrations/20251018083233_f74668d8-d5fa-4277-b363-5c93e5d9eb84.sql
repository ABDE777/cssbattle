-- Update RLS policy to allow admins to view all messages sent to any admin
DROP POLICY IF EXISTS "Admins can view messages addressed to them" ON contact_messages;

CREATE POLICY "Admins can view all messages sent to admins"
ON contact_messages
FOR SELECT
TO authenticated
USING (
  is_admin() AND 
  recipient_email IN (SELECT email FROM admins)
);