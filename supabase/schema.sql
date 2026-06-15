-- US3 — Esquema PostgreSQL / Supabase
-- Ejecutar en SQL Editor (Supabase Dashboard) antes de seed_catalogos.sql y seed_agentes.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Roles ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT
);

-- ── Usuarios (vinculable a auth.users vía auth_user_id) ──────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre          VARCHAR(100) NOT NULL,
  apellido        VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   TEXT,
  rol_id          INTEGER NOT NULL REFERENCES roles(id),
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_acceso   TIMESTAMPTZ
);

-- ── Agentes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agentes (
  id                SERIAL PRIMARY KEY,
  legajo            VARCHAR(20) NOT NULL UNIQUE,
  apellido          VARCHAR(100) NOT NULL,
  nombre            VARCHAR(150) NOT NULL,
  dni               VARCHAR(20),
  fecha_nacimiento  DATE,
  jerarquia         VARCHAR(100),
  sector            VARCHAR(50) NOT NULL DEFAULT 'US3',
  cargo             VARCHAR(100),
  email             VARCHAR(255),
  email_personal    VARCHAR(255),
  telefono          VARCHAR(50),
  jornada_laboral   TEXT,
  matricula         VARCHAR(100),
  gdeba             VARCHAR(50),
  es_medico         BOOLEAN NOT NULL DEFAULT FALSE,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_alta        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agentes_apellido ON agentes (apellido, nombre);
CREATE INDEX IF NOT EXISTS idx_agentes_es_medico ON agentes (es_medico) WHERE es_medico = TRUE;

-- ── Licencias ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS licencias (
  id              SERIAL PRIMARY KEY,
  agente_id       INTEGER NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
  tramo           SMALLINT NOT NULL DEFAULT 1 CHECK (tramo IN (1, 2)),
  desde           DATE,
  hasta           DATE,
  tomados         SMALLINT NOT NULL DEFAULT 0,
  restantes       SMALLINT NOT NULL DEFAULT 30,
  estado          VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  observaciones   TEXT,
  fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licencias_agente ON licencias (agente_id);
CREATE INDEX IF NOT EXISTS idx_licencias_fechas ON licencias (desde, hasta);

-- ── Internos ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internos (
  id                SERIAL PRIMARY KEY,
  interno           VARCHAR(50) NOT NULL UNIQUE,
  nombre            VARCHAR(100),
  apellido          VARCHAR(100),
  dni               VARCHAR(20) UNIQUE,
  fecha_nacimiento  DATE,
  sexo              VARCHAR(20),
  telefono          VARCHAR(50),
  direccion         TEXT,
  fecha_alta        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activo            BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── Patologías ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tipos_patologias (
  id                SERIAL PRIMARY KEY,
  codigo            VARCHAR(50) NOT NULL UNIQUE,
  nombre            VARCHAR(150) NOT NULL UNIQUE,
  requiere_detalle  BOOLEAN NOT NULL DEFAULT FALSE,
  es_critico        BOOLEAN NOT NULL DEFAULT FALSE,
  descripcion       TEXT,
  activo            BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS registro_patologias (
  id                  SERIAL PRIMARY KEY,
  tipo_patologia_id   INTEGER NOT NULL REFERENCES tipos_patologias(id),
  cantidad            INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  fecha               DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_id          UUID REFERENCES usuarios(id),
  observaciones       TEXT,
  fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registro_patologias_tipo ON registro_patologias (tipo_patologia_id, fecha DESC);

CREATE TABLE IF NOT EXISTS detalle_patologias (
  id              SERIAL PRIMARY KEY,
  registro_id     INTEGER NOT NULL REFERENCES registro_patologias(id) ON DELETE CASCADE,
  interno_id      INTEGER NOT NULL REFERENCES internos(id),
  observaciones   TEXT,
  fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (registro_id, interno_id)
);

-- ── Trimestrales ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tipos_trimestral (
  id          SERIAL PRIMARY KEY,
  codigo      VARCHAR(50) NOT NULL UNIQUE,
  nombre      VARCHAR(150) NOT NULL UNIQUE,
  descripcion TEXT,
  activo      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS registro_trimestral (
  id              SERIAL PRIMARY KEY,
  tipo_id         INTEGER NOT NULL REFERENCES tipos_trimestral(id),
  cantidad        INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  periodo         VARCHAR(10) NOT NULL,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_id      UUID REFERENCES usuarios(id),
  observaciones   TEXT,
  fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tipo_id, periodo)
);

CREATE INDEX IF NOT EXISTS idx_registro_trimestral_periodo ON registro_trimestral (periodo);

-- ── Turnos ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS turnos (
  id                SERIAL PRIMARY KEY,
  interno_id        INTEGER REFERENCES internos(id),
  paciente          VARCHAR(150),
  patologia         VARCHAR(200),
  especialista      VARCHAR(150),
  prequirurgico     DATE,
  anestesista       DATE,
  cardiologia       DATE,
  imagenes          DATE,
  urgencia          VARCHAR(20) NOT NULL DEFAULT 'media',
  estado            VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  observaciones     TEXT,
  fecha_turno       DATE,
  usuario_id        UUID REFERENCES usuarios(id),
  fecha_creacion    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos (estado, urgencia);

-- ── Laboratorios ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS laboratorios (
  id                  SERIAL PRIMARY KEY,
  interno_id          INTEGER REFERENCES internos(id),
  interno_label       VARCHAR(150),
  estudio             VARCHAR(200) NOT NULL,
  solicitud           VARCHAR(100),
  fecha_solicitud     DATE,
  medico_solicitante  VARCHAR(150),
  estado              VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  fecha_resultado     DATE,
  observaciones       TEXT,
  usuario_id          UUID REFERENCES usuarios(id),
  fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laboratorios_estado ON laboratorios (estado);

-- ── Auditoría ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria (
  id              BIGSERIAL PRIMARY KEY,
  usuario_id      UUID REFERENCES usuarios(id),
  usuario_nombre  VARCHAR(200),
  tabla_afectada  VARCHAR(100) NOT NULL,
  registro_id     TEXT,
  accion          VARCHAR(10) NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
  fecha_hora      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detalle         JSONB
);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria (fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla ON auditoria (tabla_afectada);
