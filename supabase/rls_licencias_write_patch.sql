-- Si ya ejecutaste rls.sql antes, corré solo este fragmento:
CREATE POLICY bootstrap_licencias_anon_write ON licencias FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);
