-- Add password_hash column to admins
ALTER TABLE public.admins
ADD COLUMN IF NOT EXISTS password_hash text;

-- Create a SECURITY DEFINER RPC to expose only name/email for Contact page
CREATE OR REPLACE FUNCTION public.get_admin_contacts()
RETURNS TABLE (name text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.name, a.email
  FROM public.admins a
  ORDER BY a.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_contacts() TO anon, authenticated;