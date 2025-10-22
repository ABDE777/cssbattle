-- Insert static admin data into the admins table
INSERT INTO public.admins (name, email) VALUES
  ('Dr. Hassan Bennani', 'hassan.bennani@ofppt.ma'),
  ('Prof. Fatima Zahra', 'fatima.zahra@ofppt.ma'),
  ('Eng. Mohamed Alami', 'mohamed.alami@ofppt.ma'),
  ('Dir. Amina Kadiri', 'amina.kadiri@ofppt.ma')
ON CONFLICT (email) DO NOTHING;