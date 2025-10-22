-- Create monthly_winners table
CREATE TABLE public.monthly_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  score INTEGER NOT NULL,
  group_name TEXT,
  winning_month DATE NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(player_id, winning_month)
);

-- Create indexes for better performance
CREATE INDEX idx_monthly_winners_player ON public.monthly_winners(player_id);
CREATE INDEX idx_monthly_winners_month ON public.monthly_winners(winning_month);
CREATE INDEX idx_monthly_winners_position ON public.monthly_winners(position);

-- Enable Row Level Security
ALTER TABLE public.monthly_winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_winners
CREATE POLICY "Players and admins can view monthly winners"
  ON public.monthly_winners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert monthly winners"
  ON public.monthly_winners FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update monthly winners"
  ON public.monthly_winners FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete monthly winners"
  ON public.monthly_winners FOR DELETE
  TO authenticated
  USING (public.is_admin());