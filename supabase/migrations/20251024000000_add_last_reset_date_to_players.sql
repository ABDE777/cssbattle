-- Add last_reset_date column to players table for monthly score reset tracking
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS last_reset_date DATE;

-- Add comment
COMMENT ON COLUMN public.players.last_reset_date IS 'Date when player score was last reset for monthly leaderboard';