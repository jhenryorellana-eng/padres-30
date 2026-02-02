-- Vista para obtener el breakdown de estrellas por mini app
-- Permite mostrar la distribucion de calificaciones estilo Play Store

CREATE OR REPLACE VIEW mini_app_rating_breakdown AS
SELECT
  mini_app_id,
  COUNT(*) FILTER (WHERE rating = 5) as five_star,
  COUNT(*) FILTER (WHERE rating = 4) as four_star,
  COUNT(*) FILTER (WHERE rating = 3) as three_star,
  COUNT(*) FILTER (WHERE rating = 2) as two_star,
  COUNT(*) FILTER (WHERE rating = 1) as one_star,
  COUNT(*) as total
FROM mini_app_ratings
GROUP BY mini_app_id;
