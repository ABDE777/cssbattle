-- Fix is_admin() function to work with hardcoded admin approach
-- This function now checks both for proper Supabase admin role AND hardcoded admin emails

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- First check if user has proper admin role through user_roles table
  SELECT 
    -- Check normal admin role assignment
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR
    -- Check if user email matches hardcoded admin emails (for local development)
    (
      auth.jwt() ->> 'email' IN (
        'ibrahimchallal@admincss.com',
        'younesshlibi@admincss.com',
        'hamdiboumlik@admincss.com',
        'mazgouraabdalmonim@gmail.com'
      )
    )
    OR
    -- Check if email is in admins table (for production admins)
    (
      auth.jwt() ->> 'email' IN (
        SELECT email FROM public.admins
      )
    )
$$;