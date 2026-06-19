/* ── Impresión y exportación CSV por módulo ── */

const ExportPrint = (() => {
  const VIEW_TITLES = {
    dashboard: 'Dashboard principal',
    licencias: 'Licencias',
    patologias: 'Patologías',
    trimestral: 'Estadísticas trimestrales',
    turnos: 'Turnos urgentes',
    laboratorios: 'Laboratorios',
    administracion: 'Administración y accesos',
    personal: 'Personal sanitario — padrón US3',
    auditoria: 'Auditoría del sistema',
    configuracion: 'Configuración',
  };

  const PAT_LABELS = {
    asmaticos: 'Asmáticos',
    diabeticos: 'Diabéticos',
    psicofarmacos: 'Psicofármacos',
    hiv: 'HIV',
    tbcFase1: 'TBC — Fase 1',
    tbcFase2: 'TBC — Fase 2',
    hipertensos: 'Hipertensos',
    celiacos: 'Celíacos',
    discapacitados: 'Discapacitados',
    colostomizados: 'Colostomizados',
    vacunados: 'Vacunados',
    tiroides: 'Hipotiroidismo / Hipertiroidismo',
  };

  const GRUPO_KEYS = ['controlAltaComplejidad', 'internados', 'huelgaHambre'];

  const TRIM_FIELDS = typeof TrimestralModel !== 'undefined'
    ? TrimestralModel.TRIMESTRAL_FIELDS.map(f => [f.key, f.label])
    : [
      ['oficios', 'Oficios contestados'],
      ['odontologia', 'Atenciones odontológicas'],
      ['psiquiatria', 'Psiquiatría'],
      ['psicologia', 'Psicología'],
      ['consultas', 'Consultas médicas'],
      ['derivaciones', 'Derivaciones hospitalarias'],
      ['laboratorios', 'Laboratorios'],
      ['radiografias', 'Radiografías'],
      ['vacunados', 'Vacunados'],
    ];

  const QUARTER_LABELS = {
    '2026-Q1': '1.er Trimestre 2026',
    '2026-Q2': '2.° Trimestre 2026',
    '2026-Q3': '3.er Trimestre 2026',
    '2026-Q4': '4.° Trimestre 2026',
  };

  function downloadCsv(filename, headers, rows) {
    const escape = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [headers.map(escape).join(',')];
    rows.forEach(r => lines.push((Array.isArray(r) ? r : headers.map(h => r[h])).map(escape).join(',')));
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function stamp() {
    return new Date().toLocaleString('es-AR');
  }

  function dashboardRows() {
    const rows = [['Indicador', 'Cantidad']];
    const total = Object.values(appData.patologias).reduce((a, b) => a + b, 0);
    rows.push(['Internos asistidos (total registros)', total]);
    Object.entries(PAT_LABELS).forEach(([key, label]) => {
      rows.push([label, appData.patologias[key] ?? 0]);
    });
    return rows;
  }

  function patologiasRows() {
    const rows = [['Patología', 'Cantidad / Interno']];
    rows.push(['Población', appData.poblacion ?? 974]);
    GRUPO_KEYS.forEach(key => {
      const g = appData.patologiasGrupos?.[key];
      if (!g) return;
      rows.push([g.label, g.internos?.length ?? 0]);
      (g.internos || []).forEach(n => rows.push([`${g.label} — detalle`, n]));
    });
    Object.entries(PAT_LABELS).forEach(([k, label]) => {
      rows.push([label, appData.patologias[k] ?? 0]);
    });
    return rows;
  }

  function trimestralRows() {
    const rows = [['Trimestre', 'Indicador', 'Mes 1', 'Mes 2', 'Mes 3', 'Total']];
    Object.keys(QUARTER_LABELS).forEach(q => {
      const data = typeof TrimestralModel !== 'undefined'
        ? TrimestralModel.normalizeQuarter(appData.trimestral[q])
        : (appData.trimestral[q] || {});
      TRIM_FIELDS.forEach(([key, label]) => {
        const total = typeof TrimestralModel !== 'undefined'
          ? TrimestralModel.fieldTotal(data[key], key)
          : (Number(data[key]) || 0);
        if (typeof TrimestralModel !== 'undefined' && TrimestralModel.isScalarField(key)) {
          rows.push([QUARTER_LABELS[q], label, '', '', '', total]);
          return;
        }
        const m = typeof TrimestralModel !== 'undefined'
          ? (data[key] || TrimestralModel.emptyMonths())
          : { m0: data[key] ?? 0, m1: 0, m2: 0 };
        rows.push([QUARTER_LABELS[q], label, m.m0, m.m1, m.m2, total]);
      });
    });
    return rows;
  }

  function turnosRows() {
    const headers = [
      'Interno', 'Patología', 'Urgencia', 'Estado general', 'Etapa', 'Progreso',
      'Cirugía especialista', 'Cirugía fecha', 'Cirugía estado', 'Notas',
    ];
    const rows = appData.turnosUrgentes.map(t => {
      const n = typeof TurnosModel !== 'undefined' ? TurnosModel.normalize(t) : t;
      const r = typeof TurnosModel !== 'undefined' ? TurnosModel.resumen(n) : { estadoGeneral: t.estado, etapa: '', completados: 0, total: 0 };
      const etapa = typeof TurnosModel !== 'undefined' ? TurnosModel.etapaTexto(r) : r.etapa;
      const cir = n.turnoCirugia || {};
      return [
        n.paciente, n.patologia, n.urgencia, r.estadoGeneral, etapa,
        `${r.completados}/${r.total}`, cir.especialista || '', cir.fecha || '', cir.estado || '', n.notas || '',
      ];
    });
    return { headers, rows };
  }

  function licenciasRows() {
    if (typeof LicenciasModule !== 'undefined' && LicenciasModule.getExportRows) {
      return LicenciasModule.getExportRows();
    }
    return { headers: ['Agente', 'Tramo', 'Desde', 'Hasta', 'Días tomados', 'Días restantes', 'Estado', 'Notas'], rows: [] };
  }

  function administracionRows() {
    return [
      ['Sección', 'Detalle'],
      ['Unidad', 'Unidad Sanitaria N°3'],
      ['Organismo', 'Dirección Provincial de Salud Penitenciaria'],
      ['Sesión', typeof US3Auth !== 'undefined' ? US3Auth.sessionLabel() : 'Solo lectura'],
      ['Exportado', stamp()],
      ['Rol', 'Descripción'],
      ['Administrador', 'Acceso total y configuración'],
      ['Personal médico', 'Edición de registros clínicos y turnos'],
      ['Administrativo', 'Gestión de licencias y estadísticas'],
      ['Solo lectura', 'Visualización sin modificar'],
    ];
  }

  function configuracionRows() {
    return [
      ['Campo', 'Valor'],
      ['Unidad', 'Unidad Sanitaria N°3'],
      ['Sistema', 'Panel de Gestión Sanitaria'],
      ['Versión', '1.0'],
      ['Tema', typeof getTheme === 'function' ? (getTheme() === 'dark' ? 'Oscuro' : 'Claro') : 'Claro'],
      ['Organismo', 'DPSP — Gobierno de la Provincia de Buenos Aires'],
      ['Exportado', stamp()],
    ];
  }

  function getExportData(view) {
    const v = view || currentView;
    switch (v) {
      case 'dashboard':
        return { filename: `dashboard_us3_${dateFile()}.csv`, headers: null, rows: dashboardRows() };
      case 'licencias': {
        const { headers, rows } = licenciasRows();
        return { filename: `licencias_us3_2026_${dateFile()}.csv`, headers, rows };
      }
      case 'patologias':
        return { filename: `patologias_us3_${dateFile()}.csv`, headers: null, rows: patologiasRows() };
      case 'trimestral':
        return { filename: `trimestral_us3_${dateFile()}.csv`, headers: null, rows: trimestralRows() };
      case 'turnos': {
        const { headers, rows } = turnosRows();
        return { filename: `turnos_urgentes_us3_${dateFile()}.csv`, headers, rows };
      }
      case 'laboratorios': {
        const { headers, rows } = typeof LaboratoriosModule !== 'undefined'
          ? LaboratoriosModule.rowsForExport()
          : { headers: ['Interno', 'Estudio'], rows: [] };
        return { filename: `laboratorios_us3_${dateFile()}.csv`, headers, rows };
      }
      case 'administracion':
        return { filename: `administracion_us3_${dateFile()}.csv`, headers: null, rows: administracionRows() };
      case 'personal': {
        const { headers, rows } = typeof PersonalModule !== 'undefined'
          ? PersonalModule.getExportRows()
          : { headers: [], rows: [] };
        return { filename: `personal_us3_${dateFile()}.csv`, headers, rows };
      }
      case 'auditoria': {
        const { headers, rows } = typeof AuditModule !== 'undefined'
          ? AuditModule.rowsForExport()
          : { headers: ['Fecha', 'Usuario', 'Módulo', 'Acción', 'Detalle'], rows: [] };
        return { filename: `auditoria_us3_${dateFile()}.csv`, headers, rows };
      }
      case 'configuracion':
        return { filename: `configuracion_us3_${dateFile()}.csv`, headers: null, rows: configuracionRows() };
      default:
        return { filename: `us3_${dateFile()}.csv`, headers: ['Dato'], rows: [['Sin datos']] };
    }
  }

  function dateFile() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  function exportCsv(view) {
    const { filename, headers, rows } = getExportData(view);
    if (headers) {
      downloadCsv(filename, headers, rows);
    } else if (rows.length) {
      downloadCsv(filename, rows[0], rows.slice(1));
    }
    if (typeof showToast === 'function') showToast('Archivo exportado correctamente', 'success');
  }

  function print(view) {
    const v = view || currentView;
    const el = document.getElementById('view-' + v);
    if (!el) return;

    let personalPrepared = false;
    let trimestralPrepared = null;
    if (v === 'personal' && typeof PersonalModule !== 'undefined' && PersonalModule.preparePrint) {
      personalPrepared = PersonalModule.preparePrint();
      if (!personalPrepared && typeof showToast === 'function') {
        showToast('El padrón aún no terminó de cargar', 'error');
        return;
      }
    }
    if (v === 'trimestral' && typeof AdminModule !== 'undefined' && AdminModule.prepareTrimestralPrint) {
      trimestralPrepared = AdminModule.prepareTrimestralPrint();
    }

    const titleEl = el.querySelector('.view-title');
    const when = stamp();
    if (titleEl) titleEl.setAttribute('data-print-date', when);

    document.body.classList.add('is-printing');
    document.body.dataset.printView = v;
    document.title = `${VIEW_TITLES[v] || v} — Unidad Sanitaria N°3`;

    const done = () => {
      if (personalPrepared && typeof PersonalModule !== 'undefined' && PersonalModule.restoreAfterPrint) {
        PersonalModule.restoreAfterPrint();
      }
      if (trimestralPrepared && typeof AdminModule !== 'undefined' && AdminModule.restoreTrimestralPrint) {
        AdminModule.restoreTrimestralPrint(trimestralPrepared);
      }
      document.body.classList.remove('is-printing');
      delete document.body.dataset.printView;
      document.title = 'Panel de Gestión — Unidad Sanitaria N°3';
      if (titleEl) titleEl.removeAttribute('data-print-date');
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
  }

  return { print, exportCsv, downloadCsv, VIEW_TITLES };
})();
