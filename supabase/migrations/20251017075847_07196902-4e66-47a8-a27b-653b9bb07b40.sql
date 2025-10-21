-- Drop unused tables
DROP TABLE IF EXISTS public.player_progress CASCADE;
DROP TABLE IF EXISTS public.modules_completed CASCADE;

-- Add verified_ofppt column to players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS verified_ofppt boolean DEFAULT false;