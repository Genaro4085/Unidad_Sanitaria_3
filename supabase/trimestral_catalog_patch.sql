-- Actualizar catálogo trimestral: Laboratorios + Vacunados (reemplaza Interconsultas / Salud mental)
INSERT INTO tipos_trimestral (codigo, nombre) VALUES
  ('laboratorios', 'Laboratorios'),
  ('vacunados', 'Vacunados')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

-- Opcional: migrar totales Q1 de interconsultas → laboratorios en registro_trimestral
UPDATE registro_trimestral dst
SET cantidad = src.cantidad
FROM registro_trimestral src
JOIN tipos_trimestral t_old ON t_old.id = src.tipo_id AND t_old.codigo = 'interconsultas'
JOIN tipos_trimestral t_new ON t_new.codigo = 'laboratorios'
WHERE dst.tipo_id = t_new.id
  AND dst.periodo = src.periodo
  AND src.periodo = '2026-Q1';

INSERT INTO registro_trimestral (tipo_id, cantidad, periodo, fecha)
SELECT t_new.id, src.cantidad, src.periodo, CURRENT_DATE
FROM registro_trimestral src
JOIN tipos_trimestral t_old ON t_old.id = src.tipo_id AND t_old.codigo = 'interconsultas'
JOIN tipos_trimestral t_new ON t_new.codigo = 'laboratorios'
WHERE src.periodo = '2026-Q1'
ON CONFLICT (tipo_id, periodo) DO UPDATE SET cantidad = EXCLUDED.cantidad;
