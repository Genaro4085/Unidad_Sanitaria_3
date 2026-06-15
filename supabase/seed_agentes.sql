-- Seed agentes US3 — generado desde JSON

-- Fuente: data\agentes-us3.json

-- Ejecutar después de schema.sql

BEGIN;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '665645', 'ALLUCHON', 'AGOSTINA', '38292357', '1994-07-07',
  'SUBALCAIDE (EP)', '3364675140',
  'a.alluchon@spb.gba.gov.ar', 'alluchonagostina@gmail.com', 'FARMACEUTICA',
  'Serv. Diario 25hs de 08 a 13hs', 'N° 22183 - MP', 'AALLUCHON', true, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '349096', 'ARANDA', 'GERMAN', '16535399', '1963-03-04',
  'PREFECTO MAYOR (EP)', '3364549549',
  'cg.aranda@spb.gba.gov.ar', 'laboratorioaranda@gmail.com', 'BIOQUIMICO',
  'Serv. Diario 25hs', 'N°3696 - MP', 'CGARANDA', true, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '661606', 'ARROYO', 'ROMINA', '31113811', '1984-04-15',
  'CABO (EG)', '3329646253',
  'ro.arroyo@spb.gba.gov.ar', 'rominaarroyo555@gmail.com', 'ENFERMERA',
  'Guardia 25hs', 'N° 165959 - MP', 'RVARROYO', false, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '358968', 'BEGINO', 'MONSERRAT', '26761401', '1978-08-05',
  'PREFECTO (EP)', '3364620285',
  'm.begino@spb.gba.gov.ar', 'monsebegino28@gmail.com', 'PSICOLOGA',
  'Serv. Diario 25hs', 'N° 14384 - MP', 'MBEGINO', false, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '358826', 'BENETTI', 'MARINA', '21434625', '1970-03-03',
  'PREFECTO (EP)', '336-4330558',
  'm.benetti@spb.gba.gov.ar', 'marinabenetti03@gmial.com', 'PSICOLOGA',
  'Serv. Diario 25hs', 'N° 15206 - MP', 'MPBEMETTI', false, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '664122', 'BERDUN', 'GONZALO', '32097292', NULL,
  'SUBALCAIDE (EP)', '3364541751',
  'g.berdun@spb.gba.gov.ar', 'gon_ber85@hotmail.com', 'ENFERMERO',
  'Guardia 25hs', 'N° 211122 - MP', 'GABERDUN', false, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '348446', 'BIGOLIN', 'LORENA', '23501138', '1973-09-09',
  'PREFECTO (EP)', '3413006602',
  'l.bigolin@spb.gba.gov.ar', 'lorenabigolin@hotmail.com', 'MEDICO',
  'Guardia 25hs', 'N° 63108 - MPSF', 'LMBIGOLIN', true, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '668257', 'BONAVENTURA', 'FRANCO', '39146514', '1995-10-23',
  'SUBALCAIDE (EP)', '3364338290',
  'f.bonaventura@spb.gba.gov.ar', 'francobonaventura0@gmail.com', 'ODONTOLOGO',
  'Serv. Diario 25hs de 11 a 16hs', 'N° 61315 - MP', 'FBONAVENTURA', true, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '345566', 'CARRERA', 'MARIA LORENA', '22435740', '1971-12-22',
  'PREFECTO (EP)', '3364652991',
  'ml.carrera@spb.gba.gov.ar', 'lorecarrera@yahoo.es', 'PSICOLOGA',
  'Serv. Diario 25hs', 'N° 15166 - MP', 'MLCARRERA', false, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '619099', 'DE', 'LA BARRA SANDRA', '20733737', '1969-10-13',
  'PREFECTO (EP)', '2214594341',
  's.delabarra@spb.gba.gov.ar', 'sanzule@hotmail.com', 'INFECTOLOGA',
  'Guardia 25hs (martes)', 'N° 115858 - MP', 'SZDELABARRA', true, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '345664', 'GIACHINI', 'JUAN', '24210839', '1974-12-19',
  'PREFECTO (EP)', '3364627004',
  'j.giachini@spb.gba.gov.ar', 'jgiachini@hotmail.com', 'MEDICO',
  'Guardia 25hs', 'N° 63264 - MP', 'JIGIACHINI', true, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '363623', 'LESPIAUCQ', 'PAULA', '22523551', '1972-06-29',
  'PREFECTO MAYOR (EP)', '2216773524',
  'p.lespiaucq@spb.gba.gov.ar', 'lalalespi@hotmail.com', 'JEFA DE UNIDAD',
  'Guardia 48hs x 15 dias', 'N° 13358 - MP', 'PLESPIAUCQ', false, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '624698', 'MACARRONE', 'MARCELO', '237468824', '1974-03-26',
  'SUBPREFECTO (EP)', '3364374183',
  'm.maccarrone@spb.gba.gov.ar', 'maccarronemarcelo@hotmail.com', 'ODONTOLOGO',
  'Serv. Diario 25hs de 8 a 13hs', 'N° 60904 - MP', 'MMACCARRONE', true, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '352184', 'MARCATELLI', 'GENOVEVA', '24007286', '1974-06-12',
  'PREFECTO (EP)', '336-4341242',
  'g.marcatelli@spb.gba.gov.ar', 'genoveva.marcatelli@gmail.com', 'ODONTOLOGA',
  'Serv. Diario 25hs de 8 a 13hs', 'N° 60926 - MP', 'GLMARCATELLI', true, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '351915', 'MASUELLI', 'SOLEDAD', '27121738', '1979-06-17',
  'PREFECTO (EP)', '3364547328',
  'm.masuelli@spb.gba.gov.ar', 'soleadmasuelli@gamil.com', 'PSICOLOGA',
  'Serv. Diario 25hs', 'N° 14384 - MP', 'MSMASUELLI', false, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '348682', 'MONTENEGRO', 'WALTER', '23394308', '1973-04-13',
  'PREFECTO (EP)', '3364214393',
  'w.montenegro@spb.gba.gov.ar', 'waltervcj@yahoo.com.ar', 'SUB JEFE',
  'Full time', 'N° 62928 - MP', 'WOMONTENEGRO', false, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '371570', 'PENA', 'AGUSTINA', '30572603', '1984-07-04',
  'PREFECTO (EP)', '336-4680656',
  'ma.pena@spb.gba.gov.ar', 'agu_pena@yahoo.com.ar', 'T. OCUPACIONAL',
  'Serv. Diario 25hs', 'N° 1436 - MP', 'MAPENA', false, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '668570', 'REBECCHINI', 'GENARO', '40858796', '1998-01-14',
  'GUARDIA (EA)', '3364-399678',
  'g.rebecchini@spb.gba.gov.ar', 'genarorebecchini@gmail.com', 'ADMINISTRATIVO',
  'Serv. Diario 30hs de 8 a 14hs', NULL, 'GREBECCHINI', false, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '665367', 'RODRIGUEZ', 'ANDRES', '21006404', '1969-09-21',
  'SUBALCAIDE (EP)', '3364660366',
  'aa.rodriguez@spb.gba.gov.ar', 'uuurorodriguez@yahoo.com.ar', 'MEDICO',
  'Guardia 25hs', 'N° 63184 - MP', 'AARODRIGUEZ2', true, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '619254', 'ROVERA', 'MATIAS', '24662541', '1975-05-29',
  'PREFECTO (EP)', '341-5863861',
  'm.rovera@spb.gba.gov.ar', 'matias.rovera@hotmail.com', 'MEDICO',
  'Guardia 25hs', 'N° 63615 - MPSF', 'MNROVERA', true, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '671745', 'SALAMA', 'LINDA SILVINA', '29501574', '1982-04-15',
  'SUBALCAIDE (EP)', '1163752407',
  'l.salama@spb.gba.gov.ar', 'silvinasalama2@gmail.com', 'PSIQUIATRA',
  'Serv. Diario 25hs', 'N° 64217 - MP', 'SLSALAMA', true, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '345671', 'SOLIS', 'JAVIER', '23262842', '1973-06-20',
  'SUB. OF PPAL (EG)', '3364600281',
  'je.solis@spb.gba.gov.ar', 'javiersolis@gmail.com', 'ENFERMERO',
  'Guardia 36hs', NULL, 'JESOLIS1', false, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '358432', 'VERGARA', 'DIEGO', '24637447', '1975-04-24',
  'SUB. OF PPAL (EG)', '3364350649',
  'di.vergara@spb.gba.gov.ar', 'beerd2010@gmail.com', 'ADM - ENFER.',
  'Serv. Diario 25hs de 08 a 13hs', NULL, 'DIVERGARA', false, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '345420', 'ZABALA', 'ROBERTO', '23746366', '1974-01-17',
  'PREFECTO (EP)', '3364562205',
  'r.zabala@spb.gba.gov.ar', 'roberto33za@msn.com', 'ENFERMERO',
  'Guardia 25hs', 'N° 192730 - MP', 'RDZABALA', false, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  '622950', 'ZALAZAR', 'ARIEL', '22194687', '1971-07-15',
  'SUBPREFECTO (EP)', '3364650558',
  'a.zalazar@spb.gba.gov.ar', 'AZALAZAR@LIVE.COM.AR', 'MEDICO',
  'Guardia 25hs', 'N° 62960 - MP', NULL, true, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;

COMMIT;