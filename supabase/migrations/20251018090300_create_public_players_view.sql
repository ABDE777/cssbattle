-- Create a public view for players that bypasses RLS
CREATE OR REPLACE VIEW public.players_public AS
SELECT 
  id,
  full_name,
  email,
  group_name,
  score,
  created_at,
  updated_at,
  cssbattle_profile_link,
  phone,
  badges,
  rank,
  verified_ofppt
FROM public.players;

-- Grant SELECT permission to anon and authenticated users
GRANT SELECT ON public.players_public TO anon, authenticated;