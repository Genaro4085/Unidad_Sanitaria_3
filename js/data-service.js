/* Capa de datos Supabase */
const DataService = (() => {
  let agentesCache = null;

  function normalizeName(name) {
    return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function displayAgentName(apellido, nombre) {
    const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    return `${cap(apellido)} ${String(nombre || '').split(/\s+/).map(cap).join(' ')}`.trim();
  }

  function getClient() {
    return typeof SupabaseClient !== 'undefined' ? SupabaseClient.get() : null;
  }

  async function isOnline() {
    if (!getClient()) return false;
    const status = await SupabaseClient.ping();
    return status.ok && status.schemaReady;
  }

  async function listAgentes() {
    const sb = getClient();
    if (!sb) return { source: 'offline', data: [] };
    const { data, error } = await sb
      .from('agentes')
      .select('id, legajo, apellido, nombre, cargo, email, telefono, es_medico, activo')
      .eq('activo', true)
      .order('apellido')
      .order('nombre');
    if (error) throw error;
    agentesCache = data || [];
    return { source: 'supabase', data: agentesCache };
  }

  async function listPersonal() {
    const sb = getClient();
    if (sb && (await isOnline())) {
      const { data, error } = await sb
        .from('agentes')
        .select(`
          id, legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
          email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector, activo
        `)
        .eq('activo', true)
        .order('apellido')
        .order('nombre');
      if (error) throw error;
      agentesCache = data || [];
      return {
        source: 'supabase',
        data: (data || []).map(mapAgenteToPersonal),
      };
    }

    const res = await fetch('data/agentes-us3.json');
    if (!res.ok) throw new Error('No se pudo cargar el padrón de personal');
    const json = await res.json();
    return { source: 'json', data: json.map(mapJsonToPersonal) };
  }

  function mapAgenteToPersonal(row) {
    return {
      supabaseId: row.id,
      id: row.id,
      apellido: row.apellido || '',
      nombre: row.nombre || '',
      apellidoNombre: displayAgentName(row.apellido, row.nombre),
      legajo: row.legajo,
      dni: row.dni || '',
      fechaNacimiento: row.fecha_nacimiento || '',
      jerarquia: row.jerarquia || '',
      telefono: row.telefono || '',
      emailOficial: row.email || '',
      emailPersonal: row.email_personal || '',
      funcion: row.cargo || '',
      jornada: row.jornada_laboral || '',
      matricula: row.matricula || '',
      gdeba: row.gdeba || '',
      esMedico: !!row.es_medico,
      sector: row.sector || 'US3',
    };
  }

  function mapJsonToPersonal(row) {
    const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    const full = String(row['Apellido Y Nombre'] || '').trim();
    const parts = full.split(/\s+/);
    const apellido = parts[0] || '';
    const nombre = parts.slice(1).join(' ');
    const cargo = String(row.Funcion || '').trim();
    const legajo = String(row['N° Leg'] ?? '');
    return {
      supabaseId: null,
      id: legajo,
      apellido,
      nombre,
      apellidoNombre: full.split(/\s+/).map(cap).join(' '),
      legajo,
      dni: String(row.DNI ?? ''),
      fechaNacimiento: row['Fecha de nacimiento'] || '',
      jerarquia: row.Jerarquia || '',
      telefono: String(row['Teléfono celular'] ?? ''),
      emailOficial: row['Mail Oficial'] || '',
      emailPersonal: String(row['Mail Personal'] || '').trim(),
      funcion: cargo,
      jornada: String(row['Jornada Laboral'] || '').trim(),
      matricula: row['N° Matricula y Tipo'] || '',
      gdeba: row.Gdeba != null ? String(row.Gdeba) : '',
      esMedico: /MEDICO|PSIQUIATR|INFECTOLOG|ODONTOLOG|FARMACEUT|BIOQUIM/i.test(cargo),
      sector: 'US3',
    };
  }

  function isMedicoCargo(funcion) {
    return /MEDICO|PSIQUIATR|INFECTOLOG|ODONTOLOG|FARMACEUT|BIOQUIM/i.test(String(funcion || ''));
  }

  async function saveAgente(entry) {
    const sb = getClient();
    if (!sb) throw new Error('Sin conexión a Supabase');

    const esMedico = entry.esMedico != null ? !!entry.esMedico : isMedicoCargo(entry.funcion);
    const payload = {
      legajo: String(entry.legajo || '').trim(),
      apellido: String(entry.apellido || '').trim(),
      nombre: String(entry.nombre || '').trim(),
      dni: entry.dni ? String(entry.dni).replace(/\D/g, '') : null,
      fecha_nacimiento: entry.fechaNacimiento || null,
      jerarquia: entry.jerarquia || null,
      telefono: entry.telefono || null,
      email: entry.emailOficial || null,
      email_personal: entry.emailPersonal || null,
      cargo: entry.funcion || null,
      jornada_laboral: entry.jornada || null,
      matricula: entry.matricula || null,
      gdeba: entry.gdeba || null,
      es_medico: esMedico,
    };

    if (!payload.legajo || !payload.apellido) {
      throw new Error('Legajo y apellido son obligatorios');
    }

    let query = sb.from('agentes').update(payload);
    if (entry.supabaseId) {
      query = query.eq('id', entry.supabaseId);
    } else {
      query = query.eq('legajo', payload.legajo);
    }

    const result = await query.select(`
      id, legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
      email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector, activo
    `).single();

    if (result.error) throw result.error;
    agentesCache = null;
    return mapAgenteToPersonal(result.data);
  }

  async function getAgentesMap() {
    if (agentesCache?.length) return agentesCache;
    await listAgentes();
    return agentesCache || [];
  }

  async function findAgenteIdByNombre(nombre) {
    const agentes = await getAgentesMap();
    const target = normalizeName(nombre);
    for (const a of agentes) {
      if (normalizeName(displayAgentName(a.apellido, a.nombre)) === target) return a.id;
    }
    return null;
  }

  function licenciaToUi(row) {
    const ag = row.agentes || {};
    return {
      id: row.id,
      agenteId: row.agente_id,
      nombre: displayAgentName(ag.apellido, ag.nombre),
      esMedico: !!ag.es_medico,
      tramo: row.tramo,
      desde: row.desde || '',
      hasta: row.hasta || '',
      tomados: row.tomados ?? 0,
      restan: row.restantes ?? 0,
      estado: row.estado || 'pendiente',
      notas: row.observaciones || '',
    };
  }

  async function listLicencias() {
    const sb = getClient();
    if (!sb) return null;
    const { data, error } = await sb
      .from('licencias')
      .select(`
        id, agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones,
        agentes ( apellido, nombre, es_medico )
      `)
      .order('id');
    if (error) throw error;
    return (data || []).map(licenciaToUi);
  }

  async function saveLicencia(entry) {
    const sb = getClient();
    if (!sb) throw new Error('Sin conexión a Supabase');

    const agenteId = entry.agenteId || await findAgenteIdByNombre(entry.nombre);
    if (!agenteId) throw new Error(`No se encontró el agente "${entry.nombre}" en la base de datos`);

    const payload = {
      agente_id: agenteId,
      tramo: entry.tramo,
      desde: entry.desde || null,
      hasta: entry.hasta || null,
      tomados: entry.tomados ?? 0,
      restantes: entry.restan ?? 0,
      estado: entry.estado || 'pendiente',
      observaciones: entry.notas || null,
    };

    let result;
    if (entry.id) {
      result = await sb.from('licencias').update(payload).eq('id', entry.id).select(`
        id, agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones,
        agentes ( apellido, nombre, es_medico )
      `).single();
    } else {
      result = await sb.from('licencias').insert(payload).select(`
        id, agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones,
        agentes ( apellido, nombre, es_medico )
      `).single();
    }

    if (result.error) throw result.error;
    return licenciaToUi(result.data);
  }

  async function seedLicenciasIfEmpty(defaults) {
    const sb = getClient();
    if (!sb || !Array.isArray(defaults) || !defaults.length) return false;

    const { count, error: countErr } = await sb
      .from('licencias')
      .select('id', { count: 'exact', head: true });
    if (countErr) throw countErr;
    if (count > 0) return false;

    const agentes = await getAgentesMap();
    const rows = [];
    for (const item of defaults) {
      const agenteId = await findAgenteIdByNombre(item.nombre);
      if (!agenteId) continue;
      rows.push({
        agente_id: agenteId,
        tramo: item.tramo,
        desde: item.desde || null,
        hasta: item.hasta || null,
        tomados: item.tomados ?? 0,
        restantes: item.restan ?? 0,
        estado: item.estado || 'pendiente',
        observaciones: item.notas || null,
      });
    }
    if (!rows.length) return false;

    const { error } = await sb.from('licencias').insert(rows);
    if (error) throw error;
    return true;
  }

  async function loadPlatformState() {
    const sb = getClient();
    if (!sb) return null;
    const { data, error } = await sb
      .from('us3_platform_state')
      .select('payload, updated_at, updated_by')
      .eq('id', 'us3')
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function savePlatformState(payload) {
    const sb = getClient();
    if (!sb) throw new Error('Sin conexión a Supabase');
    const user = (
      sessionStorage.getItem('us3_auth_user')
      || sessionStorage.getItem('us3_portal_user')
      || 'US3'
    );
    const { data, error } = await sb
      .from('us3_platform_state')
      .upsert({
        id: 'us3',
        payload,
        updated_at: new Date().toISOString(),
        updated_by: user,
      })
      .select('updated_at')
      .single();
    if (error) throw error;
    return data;
  }

  function serializeTurnoForDb(t) {
    if (typeof TurnosModel !== 'undefined') {
      const n = TurnosModel.normalize(t);
      const r = TurnosModel.resumen(n);
      const payload = {
        v: 2,
        interconsultas: n.interconsultas,
        prequirurgicos: n.prequirurgicos,
        imagenes: n.imagenes,
        turnoCirugia: n.turnoCirugia,
        notas: n.notas || '',
      };
      const interAplicada = TurnosModel.INTERCONSULTAS.find(({ key }) =>
        TurnosModel.interconsultaAplicada(n.interconsultas[key])
      );
      return {
        paciente: n.paciente || null,
        patologia: n.patologia || null,
        especialista: interAplicada?.label || null,
        prequirurgico: n.prequirurgicos?.laboratorio?.fecha || null,
        anestesista: n.prequirurgicos?.anestesista?.fecha || null,
        cardiologia: n.prequirurgicos?.cardiologia?.fecha || null,
        imagenes: n.imagenes?.[0]?.fecha || null,
        urgencia: n.urgencia || 'media',
        estado: r.estadoGeneral,
        observaciones: JSON.stringify(payload),
      };
    }
    return {
      paciente: t.paciente || null,
      patologia: t.patologia || null,
      especialista: t.especialista || null,
      prequirurgico: t.prequirurgico || null,
      anestesista: t.anestesista || null,
      cardiologia: t.cardiologia || null,
      imagenes: typeof t.imagenes === 'string' ? t.imagenes : null,
      urgencia: t.urgencia || 'media',
      estado: t.estado || 'pendiente',
      observaciones: t.notas || null,
    };
  }

  function parseTurnoFromDb(t, i) {
    let extra = null;
    try {
      if (t.observaciones && String(t.observaciones).trim().startsWith('{')) {
        extra = JSON.parse(t.observaciones);
      }
    } catch (_) { /* legacy text in observaciones */ }

    if (extra?.v === 2 && typeof TurnosModel !== 'undefined') {
      return TurnosModel.normalize({
        id: t.id || i + 1,
        supabaseId: t.id,
        paciente: t.paciente || '',
        patologia: t.patologia || '',
        urgencia: t.urgencia || 'media',
        notas: extra.notas || '',
        interconsultas: extra.interconsultas,
        prequirurgicos: extra.prequirurgicos,
        imagenes: extra.imagenes,
        turnoCirugia: extra.turnoCirugia,
        v: 2,
      });
    }

    const legacy = {
      id: t.id || i + 1,
      supabaseId: t.id,
      paciente: t.paciente || '',
      patologia: t.patologia || '',
      especialista: t.especialista || '',
      prequirurgico: t.prequirurgico || '',
      anestesista: t.anestesista || '',
      cardiologia: t.cardiologia || '',
      imagenes: t.imagenes || '',
      urgencia: t.urgencia || 'media',
      estado: t.estado || 'pendiente',
      notas: extra?.notas || t.observaciones || '',
    };
    return typeof TurnosModel !== 'undefined' ? TurnosModel.normalize(legacy) : legacy;
  }

  async function mirrorOperationalTables(platform) {
    const sb = getClient();
    if (!sb || !(await isOnline()) || !platform) return;

    const turnos = platform.turnosUrgentes || [];
    const delTurnos = await sb.from('turnos').delete().gte('id', 0);
    if (delTurnos.error) console.warn('[US3 Supabase] turnos delete:', delTurnos.error.message);
    if (turnos.length) {
      const ins = await sb.from('turnos').insert(turnos.map(serializeTurnoForDb));
      if (ins.error) console.warn('[US3 Supabase] turnos insert:', ins.error.message);
    }

    const labs = platform.laboratorios || [];
    const delLabs = await sb.from('laboratorios').delete().gte('id', 0);
    if (delLabs.error) console.warn('[US3 Supabase] laboratorios delete:', delLabs.error.message);
    if (labs.length) {
      const ins = await sb.from('laboratorios').insert(labs.map(l => ({
        interno_label: l.interno || null,
        estudio: l.estudio || 'Estudio',
        solicitud: l.solicitud || null,
        fecha_solicitud: l.solicitud || null,
        medico_solicitante: l.medicoSolicitante || l.medico || null,
        estado: l.estado || 'pendiente',
        observaciones: l.notas || l.observaciones || null,
      })));
      if (ins.error) console.warn('[US3 Supabase] laboratorios insert:', ins.error.message);
    }

    await mirrorPatologiasTrimestral(platform);
  }

  async function mirrorPatologiasTrimestral(platform) {
    const sb = getClient();
    if (!sb || !platform) return;

    const today = new Date().toISOString().slice(0, 10);

    const { data: tiposPat, error: errPat } = await sb.from('tipos_patologias').select('id, codigo');
    if (errPat) {
      console.warn('[US3 Supabase] tipos_patologias:', errPat.message);
      return;
    }
    const patMap = Object.fromEntries((tiposPat || []).map(t => [t.codigo, t.id]));

    for (const [codigo, cantidad] of Object.entries(platform.patologias || {})) {
      const tipoId = patMap[codigo];
      if (!tipoId) continue;
      await sb.from('registro_patologias').delete().eq('tipo_patologia_id', tipoId).eq('fecha', today);
      const { error } = await sb.from('registro_patologias').insert({
        tipo_patologia_id: tipoId,
        cantidad: Number(cantidad) || 0,
        fecha: today,
      });
      if (error) console.warn('[US3 Supabase] registro_patologias:', error.message);
    }

    const { data: tiposTrim, error: errTrim } = await sb.from('tipos_trimestral').select('id, codigo');
    if (errTrim) {
      console.warn('[US3 Supabase] tipos_trimestral:', errTrim.message);
      return;
    }
    const trimMap = Object.fromEntries((tiposTrim || []).map(t => [t.codigo, t.id]));

    for (const [periodo, vals] of Object.entries(platform.trimestral || {})) {
      if (!vals || typeof vals !== 'object') continue;
      for (const [codigo, cantidad] of Object.entries(vals)) {
        const tipoId = trimMap[codigo];
        if (!tipoId) continue;
        const { error } = await sb.from('registro_trimestral').upsert({
          tipo_id: tipoId,
          periodo,
          cantidad: Number(cantidad) || 0,
          fecha: today,
        }, { onConflict: 'tipo_id,periodo' });
        if (error) console.warn('[US3 Supabase] registro_trimestral:', error.message);
      }
    }
  }

  async function loadFullPlatform() {
    const remote = await loadPlatformState();
    if (remote?.payload?.platform) return remote.payload;

    const assembled = await assemblePlatformFromTables();
    if (assembled) return { version: 2, platform: assembled };

    return null;
  }

  async function assemblePlatformFromTables() {
    const sb = getClient();
    if (!sb) return null;

    const { data: turnosRows } = await sb.from('turnos').select('*').order('id');
    const { data: labRows } = await sb.from('laboratorios').select('*').order('id');

    if (!(turnosRows?.length || labRows?.length)) return null;

    const turnosUrgentes = (turnosRows || []).map((t, i) => parseTurnoFromDb(t, i));

    const laboratorios = (labRows || []).map((l, i) => ({
      id: l.id || i + 1,
      supabaseId: l.id,
      interno: l.interno_label || '',
      estudio: l.estudio || '',
      solicitud: l.fecha_solicitud || l.solicitud || '',
      medicoSolicitante: l.medico_solicitante || '',
      estado: l.estado || 'pendiente',
      notas: l.observaciones || '',
    }));

    const nextTurnoId = turnosUrgentes.length
      ? Math.max(...turnosUrgentes.map(t => t.id)) + 1
      : 1;
    const nextLabId = laboratorios.length
      ? Math.max(...laboratorios.map(l => l.id)) + 1
      : 1;

    return { turnosUrgentes, laboratorios, nextTurnoId, nextLabId };
  }

  async function saveFullPlatform(payload) {
    const saved = await savePlatformState(payload);
    if (payload?.platform) await mirrorOperationalTables(payload.platform);
    return saved;
  }

  async function saveAuditEntry(entry) {
    const sb = getClient();
    if (!sb || !(await isOnline())) return false;
    const { error } = await sb.from('auditoria').insert({
      usuario_nombre: entry.usuario || 'Sistema',
      tabla_afectada: entry.tabla || '—',
      registro_id: String(entry.registroId ?? ''),
      accion: entry.accion || 'UPDATE',
      detalle: {
        modulo: entry.modulo || '—',
        detalle: entry.detalle || '',
        ts: entry.ts || new Date().toISOString(),
        localId: entry.id,
      },
    });
    if (error) {
      console.warn('[US3 Supabase] auditoria:', error.message);
      return false;
    }
    return true;
  }

  async function fetchAuditLog() {
    const sb = getClient();
    if (!sb) return null;
    const { data, error } = await sb
      .from('auditoria')
      .select('id, usuario_nombre, tabla_afectada, registro_id, accion, fecha_hora, detalle')
      .order('fecha_hora', { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data || []).map(row => ({
      id: String(row.detalle?.localId || row.id),
      ts: row.detalle?.ts || row.fecha_hora,
      usuario: row.usuario_nombre || 'Sistema',
      modulo: row.detalle?.modulo || '—',
      tabla: row.tabla_afectada || '—',
      accion: row.accion,
      registroId: row.registro_id || '',
      detalle: row.detalle?.detalle || '',
    }));
  }

  async function deleteLicencia(id) {
    const sb = getClient();
    if (!sb) throw new Error('Sin conexión a Supabase');
    const { error } = await sb.from('licencias').delete().eq('id', id);
    if (error) throw error;
  }

  return {
    isOnline,
    listAgentes,
    listPersonal,
    saveAgente,
    listLicencias,
    saveLicencia,
    deleteLicencia,
    seedLicenciasIfEmpty,
    loadPlatformState,
    savePlatformState,
    loadFullPlatform,
    saveFullPlatform,
    mirrorOperationalTables,
    saveAuditEntry,
    fetchAuditLog,
    displayAgentName,
    normalizeName,
  };
})();
