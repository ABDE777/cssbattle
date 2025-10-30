-- Fix foreign key relationship between players and auth.users
-- Drop existing constraint if any
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_id_fkey;

-- Add proper foreign key constraint with cascade delete
ALTER TABLE public.players 
ADD CONSTRAINT players_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add index for better query performance on email lookups
CREATE INDEX IF NOT EXISTS idx_players_email ON public.players(email);

-- Ensure players.id cannot be null (it should reference auth.users.id)
ALTER TABLE public.players ALTER COLUMN id SET NOT NULL;