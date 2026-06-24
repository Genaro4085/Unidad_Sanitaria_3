-- Respaldo centralizado del panel US3 (JSON + timestamp)
-- Ejecutar en Supabase SQL Editor después de schema.sql

CREATE TABLE IF NOT EXISTS us3_platform_state (
  id          TEXT PRIMARY KEY DEFAULT 'us3',
  payload     JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  TEXT
);

CREATE INDEX IF NOT EXISTS idx_us3_platform_state_updated
  ON us3_platform_state (updated_at DESC);

ALTER TABLE us3_platform_state ENABLE ROW LEVEL SECURITY;

-- Lectura/escritura bootstrap (portal sin Supabase Auth — igual que agentes/licencias)
DROP POLICY IF EXISTS bootstrap_platform_state_anon ON us3_platform_state;
CREATE POLICY bootstrap_platform_state_anon ON us3_platform_state
  FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS platform_state_select ON us3_platform_state;
CREATE POLICY platform_state_select ON us3_platform_state
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS platform_state_write ON us3_platform_state;
CREATE POLICY platform_state_write ON us3_platform_state
  FOR ALL TO authenticated
  USING (public.us3_es_admin()) WITH CHECK (public.us3_es_admin());

-- Sync en vivo entre dispositivos (Realtime). Ejecutar una sola vez si no está habilitado:
-- ALTER PUBLICATION supabase_realtime ADD TABLE us3_platform_state;
