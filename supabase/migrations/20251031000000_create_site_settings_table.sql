-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT DEFAULT 'The platform is currently undergoing maintenance',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings
INSERT INTO public.site_settings (id, maintenance_mode, maintenance_message)
VALUES (1, false, 'The platform is currently undergoing maintenance')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Grant SELECT permission to anon and authenticated users
GRANT SELECT ON public.site_settings TO anon, authenticated;

-- Grant UPDATE permission to authenticated users (admins will have special policies)
GRANT UPDATE ON public.site_settings TO authenticated;

-- Create policy to allow admins to update site settings
CREATE POLICY "Allow admins to update site settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a 
      WHERE a.email = (SELECT auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins a 
      WHERE a.email = (SELECT auth.jwt() ->> 'email')
    )
  );

-- Create policy to allow everyone to view site settings
CREATE POLICY "Allow everyone to view site settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);