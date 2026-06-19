-- Catálogo trimestral: Radiografías
INSERT INTO tipos_trimestral (codigo, nombre) VALUES
  ('radiografias', 'Radiografías')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
