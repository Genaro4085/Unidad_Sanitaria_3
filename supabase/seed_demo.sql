-- Datos ficticios mínimos (cantidad = 1) — reemplazar cuando haya cifras reales
-- Ejecutar después de seed_catalogos.sql
BEGIN;

-- Patologías (contadores simples)
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT tp.id, 1, CURRENT_DATE FROM tipos_patologias tp
WHERE tp.codigo = 'asmaticos'
AND NOT EXISTS (
  SELECT 1 FROM registro_patologias rp WHERE rp.tipo_patologia_id = tp.id
);
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT tp.id, 1, CURRENT_DATE FROM tipos_patologias tp
WHERE tp.codigo = 'diabeticos'
AND NOT EXISTS (
  SELECT 1 FROM registro_patologias rp WHERE rp.tipo_patologia_id = tp.id
);
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT tp.id, 1, CURRENT_DATE FROM tipos_patologias tp
WHERE tp.codigo = 'psicofarmacos'
AND NOT EXISTS (
  SELECT 1 FROM registro_patologias rp WHERE rp.tipo_patologia_id = tp.id
);
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT tp.id, 1, CURRENT_DATE FROM tipos_patologias tp
WHERE tp.codigo = 'hiv'
AND NOT EXISTS (
  SELECT 1 FROM registro_patologias rp WHERE rp.tipo_patologia_id = tp.id
);
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT tp.id, 1, CURRENT_DATE FROM tipos_patologias tp
WHERE tp.codigo = 'tbcFase1'
AND NOT EXISTS (
  SELECT 1 FROM registro_patologias rp WHERE rp.tipo_patologia_id = tp.id
);
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT tp.id, 1, CURRENT_DATE FROM tipos_patologias tp
WHERE tp.codigo = 'tbcFase2'
AND NOT EXISTS (
  SELECT 1 FROM registro_patologias rp WHERE rp.tipo_patologia_id = tp.id
);
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT tp.id, 1, CURRENT_DATE FROM tipos_patologias tp
WHERE tp.codigo = 'hipertensos'
AND NOT EXISTS (
  SELECT 1 FROM registro_patologias rp WHERE rp.tipo_patologia_id = tp.id
);
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT tp.id, 1, CURRENT_DATE FROM tipos_patologias tp
WHERE tp.codigo = 'celiacos'
AND NOT EXISTS (
  SELECT 1 FROM registro_patologias rp WHERE rp.tipo_patologia_id = tp.id
);
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT tp.id, 1, CURRENT_DATE FROM tipos_patologias tp
WHERE tp.codigo = 'discapacitados'
AND NOT EXISTS (
  SELECT 1 FROM registro_patologias rp WHERE rp.tipo_patologia_id = tp.id
);
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT tp.id, 1, CURRENT_DATE FROM tipos_patologias tp
WHERE tp.codigo = 'colostomizados'
AND NOT EXISTS (
  SELECT 1 FROM registro_patologias rp WHERE rp.tipo_patologia_id = tp.id
);
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT tp.id, 1, CURRENT_DATE FROM tipos_patologias tp
WHERE tp.codigo = 'vacunados'
AND NOT EXISTS (
  SELECT 1 FROM registro_patologias rp WHERE rp.tipo_patologia_id = tp.id
);
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT tp.id, 1, CURRENT_DATE FROM tipos_patologias tp
WHERE tp.codigo = 'tiroides'
AND NOT EXISTS (
  SELECT 1 FROM registro_patologias rp WHERE rp.tipo_patologia_id = tp.id
);

-- Patologías con detalle (1 interno demo por grupo)
INSERT INTO internos (interno, nombre, apellido, activo)
VALUES ('DEMO-controlAltaComplejidad', 'Demo', 'controlAltaComplejidad', TRUE)
ON CONFLICT (interno) DO NOTHING;
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT id, 1, CURRENT_DATE FROM tipos_patologias WHERE codigo = 'controlAltaComplejidad';
INSERT INTO detalle_patologias (registro_id, interno_id, observaciones)
SELECT rp.id, i.id, 'Dato ficticio — reemplazar'
FROM registro_patologias rp
JOIN tipos_patologias tp ON tp.id = rp.tipo_patologia_id AND tp.codigo = 'controlAltaComplejidad'
JOIN internos i ON i.interno = 'DEMO-controlAltaComplejidad'
WHERE NOT EXISTS (
  SELECT 1 FROM detalle_patologias d WHERE d.registro_id = rp.id AND d.interno_id = i.id
);
INSERT INTO internos (interno, nombre, apellido, activo)
VALUES ('DEMO-internados', 'Demo', 'internados', TRUE)
ON CONFLICT (interno) DO NOTHING;
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT id, 1, CURRENT_DATE FROM tipos_patologias WHERE codigo = 'internados';
INSERT INTO detalle_patologias (registro_id, interno_id, observaciones)
SELECT rp.id, i.id, 'Dato ficticio — reemplazar'
FROM registro_patologias rp
JOIN tipos_patologias tp ON tp.id = rp.tipo_patologia_id AND tp.codigo = 'internados'
JOIN internos i ON i.interno = 'DEMO-internados'
WHERE NOT EXISTS (
  SELECT 1 FROM detalle_patologias d WHERE d.registro_id = rp.id AND d.interno_id = i.id
);
INSERT INTO internos (interno, nombre, apellido, activo)
VALUES ('DEMO-huelgaHambre', 'Demo', 'huelgaHambre', TRUE)
ON CONFLICT (interno) DO NOTHING;
INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT id, 1, CURRENT_DATE FROM tipos_patologias WHERE codigo = 'huelgaHambre';
INSERT INTO detalle_patologias (registro_id, interno_id, observaciones)
SELECT rp.id, i.id, 'Dato ficticio — reemplazar'
FROM registro_patologias rp
JOIN tipos_patologias tp ON tp.id = rp.tipo_patologia_id AND tp.codigo = 'huelgaHambre'
JOIN internos i ON i.interno = 'DEMO-huelgaHambre'
WHERE NOT EXISTS (
  SELECT 1 FROM detalle_patologias d WHERE d.registro_id = rp.id AND d.interno_id = i.id
);

-- Trimestral 2026-Q1 (valor 1 por indicador)
INSERT INTO registro_trimestral (tipo_id, cantidad, periodo, fecha)
SELECT id, 1, '2026-Q1', CURRENT_DATE FROM tipos_trimestral WHERE codigo = 'oficios'
ON CONFLICT (tipo_id, periodo) DO UPDATE SET cantidad = 1;
INSERT INTO registro_trimestral (tipo_id, cantidad, periodo, fecha)
SELECT id, 1, '2026-Q1', CURRENT_DATE FROM tipos_trimestral WHERE codigo = 'odontologia'
ON CONFLICT (tipo_id, periodo) DO UPDATE SET cantidad = 1;
INSERT INTO registro_trimestral (tipo_id, cantidad, periodo, fecha)
SELECT id, 1, '2026-Q1', CURRENT_DATE FROM tipos_trimestral WHERE codigo = 'psiquiatria'
ON CONFLICT (tipo_id, periodo) DO UPDATE SET cantidad = 1;
INSERT INTO registro_trimestral (tipo_id, cantidad, periodo, fecha)
SELECT id, 1, '2026-Q1', CURRENT_DATE FROM tipos_trimestral WHERE codigo = 'psicologia'
ON CONFLICT (tipo_id, periodo) DO UPDATE SET cantidad = 1;
INSERT INTO registro_trimestral (tipo_id, cantidad, periodo, fecha)
SELECT id, 1, '2026-Q1', CURRENT_DATE FROM tipos_trimestral WHERE codigo = 'consultas'
ON CONFLICT (tipo_id, periodo) DO UPDATE SET cantidad = 1;
INSERT INTO registro_trimestral (tipo_id, cantidad, periodo, fecha)
SELECT id, 1, '2026-Q1', CURRENT_DATE FROM tipos_trimestral WHERE codigo = 'derivaciones'
ON CONFLICT (tipo_id, periodo) DO UPDATE SET cantidad = 1;
INSERT INTO registro_trimestral (tipo_id, cantidad, periodo, fecha)
SELECT id, 1, '2026-Q1', CURRENT_DATE FROM tipos_trimestral WHERE codigo = 'interconsultas'
ON CONFLICT (tipo_id, periodo) DO UPDATE SET cantidad = 1;
INSERT INTO registro_trimestral (tipo_id, cantidad, periodo, fecha)
SELECT id, 1, '2026-Q1', CURRENT_DATE FROM tipos_trimestral WHERE codigo = 'saludMental'
ON CONFLICT (tipo_id, periodo) DO UPDATE SET cantidad = 1;

-- Turno y laboratorio demo (1 registro cada uno)
INSERT INTO internos (interno, nombre, apellido, activo)
VALUES ('DEMO-TURNO', 'Interno', 'Demo', TRUE)
ON CONFLICT (interno) DO NOTHING;
INSERT INTO turnos (interno_id, paciente, patologia, especialista, urgencia, estado, observaciones)
SELECT i.id, 'Interno Demo', 'Demo', 'Demo', 'media', 'pendiente', 'Dato ficticio'
FROM internos i WHERE i.interno = 'DEMO-TURNO'
AND NOT EXISTS (SELECT 1 FROM turnos t WHERE t.paciente = 'Interno Demo');
INSERT INTO laboratorios (interno_label, estudio, fecha_solicitud, medico_solicitante, estado, observaciones)
SELECT 'Interno Demo', 'Estudio demo', CURRENT_DATE, 'Demo', 'pendiente', 'Dato ficticio'
WHERE NOT EXISTS (SELECT 1 FROM laboratorios WHERE estudio = 'Estudio demo');
COMMIT;