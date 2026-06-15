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

  return {
    isOnline,
    listAgentes,
    listPersonal,
    saveAgente,
    listLicencias,
    saveLicencia,
    seedLicenciasIfEmpty,
    displayAgentName,
    normalizeName,
  };
})();
