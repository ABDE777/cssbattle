-- Ensure video_completed column exists in players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS video_completed boolean DEFAULT false;

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.players.video_completed IS 'Indicates whether the player has completed the required video tutorial';

-- Update any existing records to ensure the column has a value
UPDATE public.players 
SET video_completed = false 
WHERE video_completed IS NULL;