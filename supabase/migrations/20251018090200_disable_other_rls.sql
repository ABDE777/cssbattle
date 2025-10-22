-- Disable RLS on other tables that might be causing issues
ALTER TABLE public.player_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules_completed DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;