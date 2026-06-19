/* Sincroniza Turnos → Laboratorios (estudio prequirúrgico pendiente) */
const TurnosLabSync = (() => {
  const ESTUDIO = 'Prequirúrgico';
  const MEDICO = 'Anestesista';

  function syncKey(turnoId) {
    return `turno-${turnoId}-prequirurgico`;
  }

  function normalizeTurno(turno) {
    return typeof TurnosModel !== 'undefined' ? TurnosModel.normalize(turno) : turno;
  }

  /** Anestesista otorgado/realizado y paso Laboratorio del turno sin realizar. */
  function shouldAppearInLaboratorios(turno) {
    const t = normalizeTurno(turno);
    if (!t?.paciente?.trim() || !t.id) return false;

    const anest = t.prequirurgicos?.anestesista;
    const labStep = t.prequirurgicos?.laboratorio;
    if (!anest) return false;

    const { ESTADO } = TurnosModel;
    const anestListo = anest.estado === ESTADO.OTORGADO || anest.estado === ESTADO.REALIZADO;
    const labPendiente = labStep?.estado !== ESTADO.REALIZADO;

    return anestListo && labPendiente;
  }

  function buildPayload(turno) {
    const t = normalizeTurno(turno);
    const anest = t.prequirurgicos.anestesista;
    return {
      interno: t.paciente.trim(),
      estudio: ESTUDIO,
      solicitud: anest.fecha || new Date().toISOString().slice(0, 10),
      medicoSolicitante: MEDICO,
      estado: 'pendiente',
      observaciones: t.patologia ? `Turno — ${t.patologia}` : 'Generado desde Turnos',
      turnoLabKey: syncKey(t.id),
    };
  }

  function ensureLabIds() {
    if (!appData.laboratorios) appData.laboratorios = [];
    if (!appData.nextLabId) {
      const ids = appData.laboratorios.map(r => r.id).filter(Boolean);
      appData.nextLabId = ids.length ? Math.max(...ids) + 1 : 1;
    }
  }

  function rowChanged(before, after) {
    if (!before) return true;
    return before.interno !== after.interno
      || before.estudio !== after.estudio
      || before.solicitud !== after.solicitud
      || before.estado !== after.estado
      || before.medicoSolicitante !== after.medicoSolicitante;
  }

  function syncAll(options = {}) {
    const { persist = false, silent = true } = options;
    if (typeof appData === 'undefined' || typeof TurnosModel === 'undefined') return false;

    ensureLabIds();
    const activeKeys = new Set();
    let changed = false;

    (appData.turnosUrgentes || []).forEach(turno => {
      const t = normalizeTurno(turno);
      if (!shouldAppearInLaboratorios(t)) return;

      const key = syncKey(t.id);
      activeKeys.add(key);
      const payload = buildPayload(t);
      const idx = appData.laboratorios.findIndex(r => r.turnoLabKey === key);

      if (idx >= 0) {
        const merged = { ...appData.laboratorios[idx], ...payload };
        if (rowChanged(appData.laboratorios[idx], merged)) {
          appData.laboratorios[idx] = merged;
          changed = true;
        }
      } else {
        appData.laboratorios.push({ id: appData.nextLabId++, ...payload });
        changed = true;
        if (!silent && typeof logAudit === 'function') {
          logAudit({
            modulo: 'Laboratorios',
            tabla: 'laboratorios',
            accion: 'INSERT',
            registroId: key,
            detalle: `Estudio prequirúrgico generado para ${t.paciente}`,
          });
        }
      }
    });

    for (let i = appData.laboratorios.length - 1; i >= 0; i--) {
      const row = appData.laboratorios[i];
      if (row.turnoLabKey && !activeKeys.has(row.turnoLabKey)) {
        appData.laboratorios.splice(i, 1);
        changed = true;
      }
    }

    if (changed && persist && typeof saveData === 'function') saveData();
    if (changed && typeof LaboratoriosModule !== 'undefined' && LaboratoriosModule.refresh) {
      LaboratoriosModule.refresh();
    }
    return changed;
  }

  function syncTurno(turno, options = {}) {
    return syncAll({ ...options, silent: options.silent ?? true });
  }

  return {
    shouldAppearInLaboratorios,
    syncAll,
    syncTurno,
  };
})();
