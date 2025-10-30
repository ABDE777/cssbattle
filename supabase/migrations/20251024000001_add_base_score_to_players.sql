-- Add base_score column to players table for tracking CSS Battle score at last reset
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS base_score INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN public.players.base_score IS 'CSS Battle score at the time of last monthly reset';