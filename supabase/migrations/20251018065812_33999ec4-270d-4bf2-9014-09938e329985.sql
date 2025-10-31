-- Create learning_resources table for admin-managed resources
CREATE TABLE IF NOT EXISTS public.learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf','doc','link','video')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on learning_resources
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

-- Public read access for resources (no sensitive data)
CREATE POLICY "Resources readable by everyone"
ON public.learning_resources
FOR SELECT
USING (true);

-- Admins can insert resources
CREATE POLICY "Admins can create resources"
ON public.learning_resources
FOR INSERT
WITH CHECK (is_admin());

-- Admins can update resources
CREATE POLICY "Admins can update resources"
ON public.learning_resources
FOR UPDATE
USING (is_admin());

-- Admins can delete resources
CREATE POLICY "Admins can delete resources"
ON public.learning_resources
FOR DELETE
USING (is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_resources_created_at ON public.learning_resources(created_at DESC);

-- Create a public storage bucket for learning resources
INSERT INTO storage.buckets (id, name, public)
VALUES ('learning', 'learning', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the 'learning' bucket
-- Public can read
CREATE POLICY "Public can read learning files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'learning');

-- Admins can upload files
CREATE POLICY "Admins can upload learning files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'learning' AND is_admin());

-- Admins can update files
CREATE POLICY "Admins can update learning files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'learning' AND is_admin());

-- Admins can delete files
CREATE POLICY "Admins can delete learning files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'learning' AND is_admin());