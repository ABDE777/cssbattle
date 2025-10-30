-- Add profile_image_url column to players table
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add comment
COMMENT ON COLUMN public.players.profile_image_url IS 'URL to player profile image stored in avatars bucket';