-- Fix contact_messages RLS policy to allow admins to view messages addressed to them
-- The previous policy required emails to be in an 'admins' table which doesn't exist

DROP POLICY IF EXISTS "Admins can view all messages sent to admins" ON contact_messages;
DROP POLICY IF EXISTS "Admins can view messages addressed to them" ON contact_messages;

-- Updated policy: Admins can view messages addressed to their email
CREATE POLICY "Admins can view messages addressed to them"
ON contact_messages
FOR SELECT
TO authenticated
USING (
  is_admin() AND recipient_email = auth.jwt() ->> 'email'
);

-- Updated policy: Admins can update messages addressed to their email
DROP POLICY IF EXISTS "Admins can update message status" ON contact_messages;
CREATE POLICY "Admins can update messages addressed to them"
ON contact_messages
FOR UPDATE
TO authenticated
USING (
  is_admin() AND recipient_email = auth.jwt() ->> 'email'
)
WITH CHECK (
  is_admin() AND recipient_email = auth.jwt() ->> 'email'
);

-- Add index for better performance on recipient_email
CREATE INDEX IF NOT EXISTS idx_contact_messages_recipient_email ON contact_messages(recipient_email);