-- Create quiz_scores table to track player quiz performance
CREATE TABLE public.quiz_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quiz_title TEXT NOT NULL DEFAULT 'CSS Battle Quiz'
);

-- Add unique constraint to prevent duplicate quiz scores per player
ALTER TABLE public.quiz_scores 
ADD CONSTRAINT unique_player_quiz_score UNIQUE (player_id);

-- Enable RLS
ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;

-- Players can view their own scores
CREATE POLICY "Players can view their own quiz scores"
ON public.quiz_scores
FOR SELECT
USING (auth.uid() = player_id);

-- Players can insert their own scores
CREATE POLICY "Players can insert their own quiz scores"
ON public.quiz_scores
FOR INSERT
WITH CHECK (auth.uid() = player_id);

-- Admins can view all scores
CREATE POLICY "Admins can view all quiz scores"
ON public.quiz_scores
FOR SELECT
USING (is_admin());

-- Admins can delete scores
CREATE POLICY "Admins can delete quiz scores"
ON public.quiz_scores
FOR DELETE
USING (is_admin());

-- Create index for better query performance
CREATE INDEX idx_quiz_scores_player_id ON public.quiz_scores(player_id);
CREATE INDEX idx_quiz_scores_completed_at ON public.quiz_scores(completed_at DESC);