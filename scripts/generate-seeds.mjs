import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const defaultJson = path.join('data', 'agentes-us3.json');
const defaultExcel = 'c:\\Users\\genir\\OneDrive\\Desktop\\BASE DE DATOS PERSONAL 2026 - UNIDAD SANITARIA 3.xlsx';
const inputPath = process.argv[2] || defaultJson;

const PATOLOGIA_CODIGOS = [
  'asmaticos', 'diabeticos', 'psicofarmacos', 'hiv', 'tbcFase1', 'tbcFase2',
  'hipertensos', 'celiacos', 'discapacitados', 'colostomizados', 'vacunados', 'tiroides',
];
const PATOLOGIA_DETALLE = ['controlAltaComplejidad', 'internados', 'huelgaHambre'];
const TRIMESTRAL_CODIGOS = [
  'oficios', 'odontologia', 'psiquiatria', 'psicologia',
  'consultas', 'derivaciones', 'laboratorios', 'vacunados',
];

function esc(s) {
  return String(s ?? '').replace(/'/g, "''").trim();
}

function sqlVal(v) {
  if (v == null || v === '') return 'NULL';
  return `'${esc(v)}'`;
}

function splitName(full) {
  const parts = String(full).trim().split(/\s+/);
  if (parts.length < 2) return { apellido: parts[0] || '', nombre: '' };
  return { apellido: parts[0], nombre: parts.slice(1).join(' ') };
}

function displayName(full) {
  return String(full).trim().split(/\s+/).map(w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(' ');
}

function parseDate(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const year = Number(slash[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return null;
}

function isMedico(func) {
  return /MEDICO|PSIQUIATR|INFECTOLOG|ODONTOLOG|FARMACEUT|BIOQUIM/i.test(String(func || ''));
}

function normalizeTelefono(v) {
  if (v == null || v === '') return '';
  return String(v).replace(/\s/g, '');
}

function normalizeGdeba(v) {
  if (v == null || v === '') return '';
  const s = String(v).trim();
  if (/^\d{8,}$/.test(s)) return '';
  return s;
}

function agentFromJson(row) {
  return {
    fullName: row['Apellido Y Nombre'],
    legajo: row['N° Leg'],
    dni: row.DNI,
    fecha: row['Fecha de nacimiento'],
    jerarquia: row.Jerarquia,
    telefono: row['Teléfono celular'],
    email: row['Mail Oficial'],
    emailPersonal: row['Mail Personal'],
    cargo: row.Funcion,
    jornada: row['Jornada Laboral'],
    matricula: row['N° Matricula y Tipo'],
    gdeba: row.Gdeba,
  };
}

function loadFromJson(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(raw)) throw new Error('El JSON debe ser un array de agentes.');
  return raw.map(agentFromJson).filter(a => String(a.legajo ?? '').trim());
}

function loadFromExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
  const headerIdx = rows.findIndex(r => r.some(c => String(c).toLowerCase().includes('apellido')));
  if (headerIdx < 0) throw new Error('No se encontró fila de encabezados con "Apellido".');
  const header = rows[headerIdx];
  const col = (label) => {
    const i = header.findIndex(h => String(h).toLowerCase().includes(label));
    return i >= 0 ? i : null;
  };
  const COL = {
    nombre: col('apellido'), legajo: col('leg'), dni: col('dni'), fecha: col('nacimiento'),
    jerarquia: col('jerar'), telefono: col('tel'), email: col('oficial'),
    emailPersonal: col('personal'), cargo: col('funcion'), jornada: col('jornada'),
    matricula: col('matricula'), gdeba: col('gdeba'),
  };
  return rows.slice(headerIdx + 1)
    .filter(r => COL.legajo != null && String(r[COL.legajo]).trim())
    .map(r => ({
      fullName: COL.nombre != null ? r[COL.nombre] : '',
      legajo: r[COL.legajo],
      dni: COL.dni != null ? r[COL.dni] : '',
      fecha: COL.fecha != null ? r[COL.fecha] : null,
      jerarquia: COL.jerarquia != null ? r[COL.jerarquia] : '',
      telefono: COL.telefono != null ? r[COL.telefono] : '',
      email: COL.email != null ? r[COL.email] : '',
      emailPersonal: COL.emailPersonal != null ? r[COL.emailPersonal] : '',
      cargo: COL.cargo != null ? r[COL.cargo] : '',
      jornada: COL.jornada != null ? r[COL.jornada] : '',
      matricula: COL.matricula != null ? r[COL.matricula] : '',
      gdeba: COL.gdeba != null ? r[COL.gdeba] : '',
    }));
}

function loadAgents(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return { source: 'JSON', agents: loadFromJson(filePath) };
  return { source: 'Excel', agents: loadFromExcel(filePath) };
}

const LICENCIA_DESDE = '2026-10-01';
const LICENCIA_HASTA = '2026-10-01';

function buildLicenciasJs(agents) {
  const rows = [];
  let id = 1;
  for (const a of agents) {
    const nombre = displayName(a.fullName);
    const esMedico = isMedico(a.cargo);
    rows.push({
      id: id++,
      nombre,
      esMedico,
      tramo: 1,
      desde: LICENCIA_DESDE,
      hasta: LICENCIA_HASTA,
      tomados: 0,
      restan: 0,
      estado: 'pendiente',
      notas: '',
    });
  }
  return `/* Generado desde data/agentes-us3.json — no editar a mano */
window.US3_LICENCIAS_DEFAULT = ${JSON.stringify(rows, null, 2)};
`;
}

function buildSeedAgentes(agents, source, resolvedInput) {
  const lines = [
    `-- Seed agentes US3 — generado desde ${source}`,
    `-- Fuente: ${resolvedInput}`,
    '-- Ejecutar después de schema.sql',
    'BEGIN;',
  ];
  for (const row of agents) {
    const legajo = String(row.legajo ?? '').trim();
    if (!legajo) continue;
    const { apellido, nombre } = splitName(row.fullName);
    const dni = String(row.dni ?? '').replace(/\D/g, '');
    const fn = parseDate(row.fecha);
    const cargo = String(row.cargo ?? '').trim();
    const med = isMedico(cargo);
    const gdeba = normalizeGdeba(row.gdeba);
    lines.push(`INSERT INTO agentes (
  legajo, apellido, nombre, dni, fecha_nacimiento, jerarquia, telefono,
  email, email_personal, cargo, jornada_laboral, matricula, gdeba, es_medico, sector
) VALUES (
  ${sqlVal(legajo)}, ${sqlVal(apellido)}, ${sqlVal(nombre)}, ${dni ? sqlVal(dni) : 'NULL'}, ${fn ? sqlVal(fn) : 'NULL'},
  ${sqlVal(row.jerarquia)}, ${sqlVal(normalizeTelefono(row.telefono))},
  ${sqlVal(row.email)}, ${sqlVal(row.emailPersonal)}, ${sqlVal(cargo)},
  ${sqlVal(row.jornada)}, ${sqlVal(row.matricula)}, ${gdeba ? sqlVal(gdeba) : 'NULL'}, ${med}, 'US3'
) ON CONFLICT (legajo) DO UPDATE SET
  apellido = EXCLUDED.apellido, nombre = EXCLUDED.nombre, dni = EXCLUDED.dni,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento, jerarquia = EXCLUDED.jerarquia,
  telefono = EXCLUDED.telefono, email = EXCLUDED.email, email_personal = EXCLUDED.email_personal,
  cargo = EXCLUDED.cargo, jornada_laboral = EXCLUDED.jornada_laboral,
  matricula = EXCLUDED.matricula, gdeba = EXCLUDED.gdeba, es_medico = EXCLUDED.es_medico;`);
  }
  lines.push('COMMIT;');
  return lines.join('\n\n');
}

function buildSeedLicencias(agents) {
  const lines = [
    '-- Licencias US3 — tramo 1, fechas 2026-10-01, días en cero',
    '-- Ejecutar después de seed_agentes.sql',
    'BEGIN;',
    'DELETE FROM licencias;',
  ];
  for (const row of agents) {
    const legajo = String(row.legajo ?? '').trim();
    if (!legajo) continue;
    lines.push(`INSERT INTO licencias (agente_id, tramo, desde, hasta, tomados, restantes, estado, observaciones)
SELECT a.id, 1, ${sqlVal(LICENCIA_DESDE)}::date, ${sqlVal(LICENCIA_HASTA)}::date, 0, 0, 'pendiente', NULL
FROM agentes a WHERE a.legajo = ${sqlVal(legajo)};`);
  }
  lines.push('COMMIT;');
  return lines.join('\n\n');
}

function buildSeedDemo() {
  const lines = [
    '-- Datos ficticios mínimos (cantidad = 1) — reemplazar cuando haya cifras reales',
    '-- Ejecutar después de seed_catalogos.sql',
    'BEGIN;',
    '',
    '-- Patologías (contadores simples)',
  ];
  for (const codigo of PATOLOGIA_CODIGOS) {
    lines.push(`INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT tp.id, 1, CURRENT_DATE FROM tipos_patologias tp
WHERE tp.codigo = ${sqlVal(codigo)}
AND NOT EXISTS (
  SELECT 1 FROM registro_patologias rp WHERE rp.tipo_patologia_id = tp.id
);`);
  }
  lines.push('', '-- Patologías con detalle (1 interno demo por grupo)');
  for (const codigo of PATOLOGIA_DETALLE) {
    lines.push(`INSERT INTO internos (interno, nombre, apellido, activo)
VALUES (${sqlVal(`DEMO-${codigo}`)}, 'Demo', ${sqlVal(codigo)}, TRUE)
ON CONFLICT (interno) DO NOTHING;`);
    lines.push(`INSERT INTO registro_patologias (tipo_patologia_id, cantidad, fecha)
SELECT id, 1, CURRENT_DATE FROM tipos_patologias WHERE codigo = ${sqlVal(codigo)};`);
    lines.push(`INSERT INTO detalle_patologias (registro_id, interno_id, observaciones)
SELECT rp.id, i.id, 'Dato ficticio — reemplazar'
FROM registro_patologias rp
JOIN tipos_patologias tp ON tp.id = rp.tipo_patologia_id AND tp.codigo = ${sqlVal(codigo)}
JOIN internos i ON i.interno = ${sqlVal(`DEMO-${codigo}`)}
WHERE NOT EXISTS (
  SELECT 1 FROM detalle_patologias d WHERE d.registro_id = rp.id AND d.interno_id = i.id
);`);
  }
  lines.push('', '-- Trimestral 2026-Q1 (valor 1 por indicador)');
  for (const codigo of TRIMESTRAL_CODIGOS) {
    lines.push(`INSERT INTO registro_trimestral (tipo_id, cantidad, periodo, fecha)
SELECT id, 1, '2026-Q1', CURRENT_DATE FROM tipos_trimestral WHERE codigo = ${sqlVal(codigo)}
ON CONFLICT (tipo_id, periodo) DO UPDATE SET cantidad = 1;`);
  }
  lines.push('', '-- Turno y laboratorio demo (1 registro cada uno)');
  lines.push(`INSERT INTO internos (interno, nombre, apellido, activo)
VALUES ('DEMO-TURNO', 'Interno', 'Demo', TRUE)
ON CONFLICT (interno) DO NOTHING;`);
  lines.push(`INSERT INTO turnos (interno_id, paciente, patologia, especialista, urgencia, estado, observaciones)
SELECT i.id, 'Interno Demo', 'Demo', 'Demo', 'media', 'pendiente', 'Dato ficticio'
FROM internos i WHERE i.interno = 'DEMO-TURNO'
AND NOT EXISTS (SELECT 1 FROM turnos t WHERE t.paciente = 'Interno Demo');`);
  lines.push(`INSERT INTO laboratorios (interno_label, estudio, fecha_solicitud, medico_solicitante, estado, observaciones)
SELECT 'Interno Demo', 'Estudio demo', CURRENT_DATE, 'Demo', 'pendiente', 'Dato ficticio'
WHERE NOT EXISTS (SELECT 1 FROM laboratorios WHERE estudio = 'Estudio demo');`);
  lines.push('COMMIT;');
  return lines.join('\n');
}

const resolvedInput = fs.existsSync(inputPath)
  ? inputPath
  : (fs.existsSync(defaultJson) ? defaultJson : defaultExcel);

const { source, agents } = loadAgents(resolvedInput);

fs.mkdirSync('supabase', { recursive: true });
fs.mkdirSync('js', { recursive: true });

fs.writeFileSync(path.join('supabase', 'seed_agentes.sql'), buildSeedAgentes(agents, source, resolvedInput));
fs.writeFileSync(path.join('supabase', 'seed_licencias.sql'), buildSeedLicencias(agents));
fs.writeFileSync(path.join('supabase', 'seed_demo.sql'), buildSeedDemo());
fs.writeFileSync(path.join('js', 'licencias-default.js'), buildLicenciasJs(agents));

console.log(`Seeds generados (${agents.length} agentes):`);
console.log('  supabase/seed_agentes.sql');
console.log('  supabase/seed_licencias.sql');
console.log('  supabase/seed_demo.sql');
console.log('  js/licencias-default.js');
