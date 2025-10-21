-- Allow admins to insert messages in contact_messages table
-- This is needed for the admin messaging feature to work properly

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can insert messages" ON public.contact_messages;

-- Create new policy allowing admins to insert messages
CREATE POLICY "Admins can insert messages"
  ON public.contact_messages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Grant INSERT permission to authenticated users (if not already granted)
GRANT INSERT ON public.contact_messages TO authenticated;