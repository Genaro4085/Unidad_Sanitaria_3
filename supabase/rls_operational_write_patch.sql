-- Escritura anon temporal para sincronizar turnos, laboratorios y registros.
-- Ejecutar si el panel aún usa portal us3/us3 (sin Supabase Auth).

DROP POLICY IF EXISTS bootstrap_turnos_anon_write ON turnos;
CREATE POLICY bootstrap_turnos_anon_write ON turnos
  FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS bootstrap_laboratorios_anon_write ON laboratorios;
CREATE POLICY bootstrap_laboratorios_anon_write ON laboratorios
  FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);
