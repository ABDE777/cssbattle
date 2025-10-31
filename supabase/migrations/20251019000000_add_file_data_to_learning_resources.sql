-- Add file data columns to learning_resources table for direct file storage
ALTER TABLE public.learning_resources
ADD COLUMN IF NOT EXISTS file_data BYTEA,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- Update the url column to be nullable since we'll store file data directly
ALTER TABLE public.learning_resources
ALTER COLUMN url DROP NOT NULL;

-- Add a constraint to ensure either url or file_data is provided
ALTER TABLE public.learning_resources
ADD CONSTRAINT learning_resources_content_check
CHECK (
  (url IS NOT NULL AND file_data IS NULL) OR 
  (url IS NULL AND file_data IS NOT NULL)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_resources_file_name ON public.learning_resources(file_name);
CREATE INDEX IF NOT EXISTS idx_learning_resources_file_type ON public.learning_resources(file_type);