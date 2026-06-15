-- Licencias US3 — tramo 1, fechas 2026-10-01, días en cero

-- Ejecutar después de seed_agentes.sql

BEGIN;

DELETE FROM licencias;

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '665645';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '349096';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '661606';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '358968';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '358826';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '664122';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '348446';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '668257';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '345566';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '619099';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '345664';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '363623';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '624698';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '352184';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '351915';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '348682';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '371570';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '668570';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '665367';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '619254';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '671745';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '345671';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '358432';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '345420';

INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, '2026-10-01'::date, '2026-10-01'::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = '622950';

COMMIT;