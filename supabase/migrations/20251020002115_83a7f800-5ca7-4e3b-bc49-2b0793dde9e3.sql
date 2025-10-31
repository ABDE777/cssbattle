-- Add video_completed column to players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS video_completed boolean DEFAULT false;