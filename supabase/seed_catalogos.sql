-- Catálogos iniciales US3 — ejecutar después de schema.sql

BEGIN;

INSERT INTO roles (nombre, descripcion) VALUES
  ('Administrador', 'Acceso completo al sistema'),
  ('Agente', 'Solo lectura en módulos operativos')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipos_patologias (codigo, nombre, requiere_detalle, es_critico) VALUES
  ('asmaticos', 'Asmáticos', FALSE, FALSE),
  ('diabeticos', 'Diabéticos', FALSE, FALSE),
  ('psicofarmacos', 'Psicofármacos', FALSE, FALSE),
  ('hiv', 'HIV', FALSE, FALSE),
  ('tbcFase1', 'TBC — Fase 1', FALSE, FALSE),
  ('tbcFase2', 'TBC — Fase 2', FALSE, FALSE),
  ('hipertensos', 'Hipertensos', FALSE, FALSE),
  ('celiacos', 'Celíacos', FALSE, FALSE),
  ('discapacitados', 'Discapacitados', FALSE, FALSE),
  ('colostomizados', 'Colostomizados', FALSE, FALSE),
  ('vacunados', 'Vacunados', FALSE, FALSE),
  ('tiroides', 'Hipotiroidismo / Hipertiroidismo', FALSE, FALSE),
  ('controlAltaComplejidad', 'Control diario alta complejidad', TRUE, TRUE),
  ('internados', 'Internados', TRUE, FALSE),
  ('huelgaHambre', 'Huelga de hambre', TRUE, FALSE)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  requiere_detalle = EXCLUDED.requiere_detalle,
  es_critico = EXCLUDED.es_critico;

INSERT INTO tipos_trimestral (codigo, nombre) VALUES
  ('oficios', 'Oficios contestados'),
  ('odontologia', 'Atenciones odontológicas'),
  ('psiquiatria', 'Atenciones psiquiátricas'),
  ('psicologia', 'Atenciones psicológicas'),
  ('consultas', 'Consultas médicas'),
  ('derivaciones', 'Derivaciones hospitalarias'),
  ('interconsultas', 'Interconsultas'),
  ('saludMental', 'Salud mental (total)')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

COMMIT;
