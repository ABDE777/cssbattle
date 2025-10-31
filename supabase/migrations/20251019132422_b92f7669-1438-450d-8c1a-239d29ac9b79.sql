-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can view admin data" ON public.admins;

-- Insert the four static admins (if not already present)
INSERT INTO public.admins (name, email) VALUES
  ('Abd El Monim Mazgoura', 'mazgouraabdalmonim@gmail.com'),
  ('Admin 2', 'admin2@example.com'),
  ('Admin 3', 'admin3@example.com'),
  ('Admin 4', 'admin4@example.com')
ON CONFLICT (email) DO NOTHING;

-- Create policy: Admins can view admin data
CREATE POLICY "Admins can view admin data"
ON public.admins
FOR SELECT
TO authenticated
USING (
  is_admin() OR email = (SELECT a.email FROM public.admins a WHERE a.id = auth.uid())
);