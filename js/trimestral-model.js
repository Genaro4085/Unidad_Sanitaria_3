/* Modelo trimestrales — US3 (v2: desglose por mes) */
const TrimestralModel = (() => {
  const QUARTERS = [
    { key: '2026-Q1', label: '1.er Trimestre 2026', short: 'T1' },
    { key: '2026-Q2', label: '2.° Trimestre 2026', short: 'T2' },
    { key: '2026-Q3', label: '3.er Trimestre 2026', short: 'T3' },
    { key: '2026-Q4', label: '4.° Trimestre 2026', short: 'T4' },
  ];

  const QUARTER_MONTHS = {
    '2026-Q1': ['Enero', 'Febrero', 'Marzo'],
    '2026-Q2': ['Abril', 'Mayo', 'Junio'],
    '2026-Q3': ['Julio', 'Agosto', 'Septiembre'],
    '2026-Q4': ['Octubre', 'Noviembre', 'Diciembre'],
  };

  const TRIMESTRAL_FIELDS = [
    { key: 'oficios', label: 'Oficios contestados', icon: 'ti-file-check' },
    { key: 'odontologia', label: 'Atenciones odontológicas', icon: 'ti-dental' },
    { key: 'psiquiatria', label: 'Psiquiatría', icon: 'ti-brain' },
    { key: 'psicologia', label: 'Psicología', icon: 'ti-mood-smile' },
    { key: 'consultas', label: 'Consultas médicas', icon: 'ti-stethoscope' },
    { key: 'derivaciones', label: 'Derivaciones hospitalarias', icon: 'ti-building-hospital' },
    { key: 'laboratorios', label: 'Laboratorios', icon: 'ti-flask' },
    { key: 'vacunados', label: 'Vacunados', icon: 'ti-vaccine' },
  ];

  const FIELD_KEYS = TRIMESTRAL_FIELDS.map(f => f.key);
  const LEGACY_RENAMES = { interconsultas: 'laboratorios' };
  const LEGACY_DROP = ['saludMental'];

  function emptyMonths() {
    return { m0: 0, m1: 0, m2: 0 };
  }

  function createQuarterData({ firstMonthValue = 0 } = {}) {
    const q = {};
    TRIMESTRAL_FIELDS.forEach(({ key }) => {
      q[key] = { m0: firstMonthValue, m1: 0, m2: 0 };
    });
    return q;
  }

  function createDefaultTrimestral() {
    return {
      '2026-Q1': createQuarterData({ firstMonthValue: 1 }),
      '2026-Q2': createQuarterData(),
      '2026-Q3': createQuarterData(),
      '2026-Q4': createQuarterData(),
    };
  }

  function normalizeMonthValue(val) {
    if (val != null && typeof val === 'object' && !Array.isArray(val)) {
      return {
        m0: Math.max(0, parseInt(val.m0, 10) || 0),
        m1: Math.max(0, parseInt(val.m1, 10) || 0),
        m2: Math.max(0, parseInt(val.m2, 10) || 0),
      };
    }
    const n = Math.max(0, parseInt(val, 10) || 0);
    return { m0: n, m1: 0, m2: 0 };
  }

  function applyLegacyAliases(raw) {
    const r = { ...(raw || {}) };
    Object.entries(LEGACY_RENAMES).forEach(([from, to]) => {
      if (r[from] !== undefined && r[to] === undefined) r[to] = r[from];
    });
    LEGACY_DROP.forEach(k => { delete r[k]; });
    delete r.interconsultas;
    return r;
  }

  function normalizeQuarter(raw) {
    const r = applyLegacyAliases(raw);
    const q = {};
    TRIMESTRAL_FIELDS.forEach(({ key }) => {
      q[key] = normalizeMonthValue(r[key]);
    });
    return q;
  }

  function normalizeAll(trimestral) {
    const base = createDefaultTrimestral();
    const out = {};
    QUARTERS.forEach(({ key }) => {
      out[key] = normalizeQuarter({ ...base[key], ...(trimestral?.[key] || {}) });
    });
    return out;
  }

  function monthLabels(quarterKey) {
    return QUARTER_MONTHS[quarterKey] || ['Mes 1', 'Mes 2', 'Mes 3'];
  }

  function fieldTotal(fieldData) {
    const m = normalizeMonthValue(fieldData);
    return m.m0 + m.m1 + m.m2;
  }

  function quarterTotals(quarterData) {
    const totals = {};
    TRIMESTRAL_FIELDS.forEach(({ key }) => {
      totals[key] = fieldTotal(quarterData?.[key]);
    });
    return totals;
  }

  return {
    QUARTERS,
    QUARTER_MONTHS,
    TRIMESTRAL_FIELDS,
    FIELD_KEYS,
    createDefaultTrimestral,
    normalizeQuarter,
    normalizeAll,
    monthLabels,
    fieldTotal,
    quarterTotals,
    emptyMonths,
  };
})();
