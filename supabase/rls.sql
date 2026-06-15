-- Row Level Security — US3
-- Ejecutar después de schema.sql y seeds

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE licencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE internos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_patologias ENABLE ROW LEVEL SECURITY;
ALTER TABLE registro_patologias ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_patologias ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_trimestral ENABLE ROW LEVEL SECURITY;
ALTER TABLE registro_trimestral ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.us3_rol_usuario()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.nombre
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
  WHERE u.auth_user_id = auth.uid()
    AND u.activo = TRUE
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.us3_es_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.us3_rol_usuario() = 'Administrador', FALSE);
$$;

-- Lectura operativa (autenticados)
CREATE POLICY agentes_select ON agentes FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY licencias_select ON licencias FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY internos_select ON internos FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY tipos_patologias_select ON tipos_patologias FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY registro_patologias_select ON registro_patologias FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY detalle_patologias_select ON detalle_patologias FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY tipos_trimestral_select ON tipos_trimestral FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY registro_trimestral_select ON registro_trimestral FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY turnos_select ON turnos FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY laboratorios_select ON laboratorios FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY auditoria_select ON auditoria FOR SELECT TO authenticated
  USING (public.us3_es_admin());

-- Escritura solo administrador
CREATE POLICY agentes_write ON agentes FOR ALL TO authenticated
  USING (public.us3_es_admin()) WITH CHECK (public.us3_es_admin());
CREATE POLICY licencias_write ON licencias FOR ALL TO authenticated
  USING (public.us3_es_admin()) WITH CHECK (public.us3_es_admin());
CREATE POLICY internos_write ON internos FOR ALL TO authenticated
  USING (public.us3_es_admin()) WITH CHECK (public.us3_es_admin());
CREATE POLICY registro_patologias_write ON registro_patologias FOR ALL TO authenticated
  USING (public.us3_es_admin()) WITH CHECK (public.us3_es_admin());
CREATE POLICY detalle_patologias_write ON detalle_patologias FOR ALL TO authenticated
  USING (public.us3_es_admin()) WITH CHECK (public.us3_es_admin());
CREATE POLICY registro_trimestral_write ON registro_trimestral FOR ALL TO authenticated
  USING (public.us3_es_admin()) WITH CHECK (public.us3_es_admin());
CREATE POLICY turnos_write ON turnos FOR ALL TO authenticated
  USING (public.us3_es_admin()) WITH CHECK (public.us3_es_admin());
CREATE POLICY laboratorios_write ON laboratorios FOR ALL TO authenticated
  USING (public.us3_es_admin()) WITH CHECK (public.us3_es_admin());

-- Auditoría: append-only vía triggers/service; sin UPDATE/DELETE desde app
CREATE POLICY auditoria_insert ON auditoria FOR INSERT TO authenticated
  WITH CHECK (public.us3_es_admin() OR auth.uid() IS NOT NULL);

CREATE POLICY roles_select ON roles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY usuarios_admin ON usuarios FOR ALL TO authenticated
  USING (public.us3_es_admin()) WITH CHECK (public.us3_es_admin());

-- Bootstrap temporal: el panel aún usa portal us3/us3 (sin Supabase Auth).
-- Eliminar estas políticas cuando el login pase por auth.users.
CREATE POLICY bootstrap_agentes_anon ON agentes FOR SELECT TO anon USING (TRUE);
CREATE POLICY bootstrap_licencias_anon ON licencias FOR SELECT TO anon USING (TRUE);
CREATE POLICY bootstrap_internos_anon ON internos FOR SELECT TO anon USING (TRUE);
CREATE POLICY bootstrap_tipos_patologias_anon ON tipos_patologias FOR SELECT TO anon USING (TRUE);
CREATE POLICY bootstrap_registro_patologias_anon ON registro_patologias FOR SELECT TO anon USING (TRUE);
CREATE POLICY bootstrap_detalle_patologias_anon ON detalle_patologias FOR SELECT TO anon USING (TRUE);
CREATE POLICY bootstrap_tipos_trimestral_anon ON tipos_trimestral FOR SELECT TO anon USING (TRUE);
CREATE POLICY bootstrap_registro_trimestral_anon ON registro_trimestral FOR SELECT TO anon USING (TRUE);
CREATE POLICY bootstrap_turnos_anon ON turnos FOR SELECT TO anon USING (TRUE);
CREATE POLICY bootstrap_laboratorios_anon ON laboratorios FOR SELECT TO anon USING (TRUE);

-- Escritura temporal (portal demo sin Supabase Auth) — eliminar en producción
CREATE POLICY bootstrap_licencias_anon_write ON licencias FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY bootstrap_agentes_anon_write ON agentes FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);
