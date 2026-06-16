-- Permisos anon temporales para sincronización completa (portal us3/us3 sin Auth).
-- Ejecutar después de platform_state.sql y rls_operational_write_patch.sql

DROP POLICY IF EXISTS bootstrap_registro_patologias_anon_write ON registro_patologias;
CREATE POLICY bootstrap_registro_patologias_anon_write ON registro_patologias
  FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS bootstrap_registro_trimestral_anon_write ON registro_trimestral;
CREATE POLICY bootstrap_registro_trimestral_anon_write ON registro_trimestral
  FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS bootstrap_auditoria_anon ON auditoria;
CREATE POLICY bootstrap_auditoria_anon ON auditoria
  FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

-- Evita duplicados al sincronizar patologías del día
CREATE UNIQUE INDEX IF NOT EXISTS idx_registro_patologias_tipo_fecha
  ON registro_patologias (tipo_patologia_id, fecha);
