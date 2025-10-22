-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Insert static admin data
INSERT INTO public.admins (name, email) VALUES
  ('Dr. Hassan Bennani', 'hassan.bennani@ofppt.ma'),
  ('Prof. Fatima Zahra', 'fatima.zahra@ofppt.ma'),
  ('Eng. Mohamed Alami', 'mohamed.alami@ofppt.ma')
ON CONFLICT (email) DO NOTHING;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.admins TO authenticated;

-- Create policy to allow authenticated users to view admins
CREATE POLICY "Allow authenticated users to view admins"
  ON public.admins FOR SELECT
  TO authenticated
  USING (true);