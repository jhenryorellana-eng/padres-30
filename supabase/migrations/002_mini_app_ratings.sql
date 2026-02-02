-- Tabla de calificaciones de mini apps
CREATE TABLE IF NOT EXISTS mini_app_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mini_app_id TEXT NOT NULL,
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un usuario solo puede calificar una vez por app
  CONSTRAINT unique_user_app_rating UNIQUE (mini_app_id, profile_id)
);

-- Índices
CREATE INDEX idx_mini_app_ratings_app_id ON mini_app_ratings(mini_app_id);
CREATE INDEX idx_mini_app_ratings_profile_id ON mini_app_ratings(profile_id);

-- RLS
ALTER TABLE mini_app_ratings ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer las calificaciones
CREATE POLICY "Anyone can read ratings"
  ON mini_app_ratings FOR SELECT
  USING (true);

-- Solo usuarios autenticados pueden crear/editar su propia calificación
CREATE POLICY "Users can insert own rating"
  ON mini_app_ratings FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own rating"
  ON mini_app_ratings FOR UPDATE
  USING (auth.uid() = profile_id);

-- Vista para estadísticas agregadas por app
CREATE VIEW mini_app_stats AS
SELECT
  mini_app_id,
  COUNT(*) as total_ratings,
  ROUND(AVG(rating)::numeric, 1) as average_rating,
  COUNT(CASE WHEN comment IS NOT NULL AND comment != '' THEN 1 END) as total_comments
FROM mini_app_ratings
GROUP BY mini_app_id;
