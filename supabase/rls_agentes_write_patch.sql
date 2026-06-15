-- Si ya ejecutaste rls.sql antes, corré este fragmento para permitir edición del padrón:
CREATE POLICY bootstrap_agentes_anon_write ON agentes FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);
