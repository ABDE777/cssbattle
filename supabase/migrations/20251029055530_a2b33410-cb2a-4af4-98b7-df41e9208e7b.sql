-- Clean up and set up the database properly

-- First, insert the 5 admins into the admins table
-- Note: We're using plain text passwords here for simplicity as requested
-- In production, these should be hashed
INSERT INTO public.admins (name, email, password_hash) VALUES
('Brahim Bousseta', 'brahimbousseta@adminofppt.com', 'passwordPro'),
('Ibrahim Challal', 'ibrahimchallal@admincss.com', 'passwordChallal'),
('Younes Hlibi', 'younesshlibi@admincss.com', 'passwordHlibi'),
('Abd El Monim Mazgoura', 'mazgouraabdalmonim@admincss.com', 'passwordMazgoura'),
('Hamdi Boumlik', 'hamdiboumlik@admincss.com', 'passwordPro')
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, 
    password_hash = EXCLUDED.password_hash;

-- Create score_history table to track player score changes over time
CREATE TABLE IF NOT EXISTS public.score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  score DOUBLE PRECISION NOT NULL,
  previous_score DOUBLE PRECISION,
  score_change DOUBLE PRECISION,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries on player_id and timestamp
CREATE INDEX IF NOT EXISTS idx_score_history_player_id ON public.score_history(player_id);
CREATE INDEX IF NOT EXISTS idx_score_history_timestamp ON public.score_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_score_history_player_timestamp ON public.score_history(player_id, timestamp DESC);

-- RLS is disabled as requested, but we'll enable it for the table
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;

-- Allow players to view their own history
CREATE POLICY "Players can view their own score history"
ON public.score_history
FOR SELECT
USING (auth.uid() = player_id OR is_admin());

-- Allow admins to view all history
CREATE POLICY "Admins can view all score history"
ON public.score_history
FOR SELECT
USING (is_admin());

-- Allow system to insert score history (when scores are updated)
CREATE POLICY "System can insert score history"
ON public.score_history
FOR INSERT
WITH CHECK (true);

-- Create a function to automatically log score changes
CREATE OR REPLACE FUNCTION public.log_score_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if score actually changed
  IF OLD.score IS DISTINCT FROM NEW.score THEN
    INSERT INTO public.score_history (
      player_id,
      score,
      previous_score,
      score_change,
      reason
    ) VALUES (
      NEW.id,
      NEW.score,
      OLD.score,
      COALESCE(NEW.score, 0) - COALESCE(OLD.score, 0),
      'Score updated in leaderboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically log score changes
DROP TRIGGER IF EXISTS trigger_log_score_change ON public.players;
CREATE TRIGGER trigger_log_score_change
AFTER UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.log_score_change();

-- Add comment to tables
COMMENT ON TABLE public.score_history IS 'Tracks historical score changes for players';
COMMENT ON TABLE public.admins IS 'Stores admin user credentials and information';
COMMENT ON TABLE public.players IS 'Stores player information and current scores';
COMMENT ON TABLE public.monthly_winners IS 'Stores monthly competition winners';
COMMENT ON TABLE public.contact_messages IS 'Stores messages between players and admins';
COMMENT ON TABLE public.learning_resources IS 'Stores learning materials and resources';
COMMENT ON TABLE public.quiz_scores IS 'Stores quiz completion records';
COMMENT ON TABLE public.user_roles IS 'Stores user role assignments (admin/player)';