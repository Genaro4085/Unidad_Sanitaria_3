/* Modelo de control de turnos quirúrgicos — US3 */
const TurnosModel = (() => {
  const ESTADO = {
    SOLICITADO: 'solicitado',
    OTORGADO: 'otorgado',
    REALIZADO: 'realizado',
    NO_REQUIERE: 'no_requiere',
  };

  const ESTADO_LABELS = {
    solicitado: 'Solicitado',
    otorgado: 'Otorgado',
    realizado: 'Realizado',
    no_requiere: 'No requiere',
  };

  const ESTADOS_PASO = ['solicitado', 'otorgado', 'realizado', 'no_requiere'];
  const ESTADOS_INTERCONSULTA = ESTADOS_PASO;

  const INTERCONSULTAS = [
    { key: 'cirugia_general', label: 'Cirugía general' },
    { key: 'traumatologia', label: 'Traumatología' },
    { key: 'urologia', label: 'Urología' },
    { key: 'oftalmologia', label: 'Oftalmología' },
    { key: 'otorrinolaringologia', label: 'Otorrinolaringología' },
    { key: 'gastroenterologia', label: 'Gastroenterología' },
    { key: 'neurologia', label: 'Neurología' },
    { key: 'oncologia', label: 'Oncología' },
    { key: 'endocrinologia', label: 'Endocrinología' },
    { key: 'diabetologia', label: 'Diabetología' },
  ];

  const PREQUIRURGICOS = [
    { key: 'cardiologia', label: 'Cardiología' },
    { key: 'anestesista', label: 'Anestesista' },
    { key: 'laboratorio', label: 'Laboratorio' },
  ];

  const TIPOS_IMAGEN = [
    { value: 'tomografia', label: 'Tomografía' },
    { value: 'ecografia', label: 'Ecografía' },
    { value: 'radiografia', label: 'Radiografía' },
    { value: 'resonancia', label: 'Resonancia magnética' },
    { value: 'otro', label: 'Otro' },
  ];

  const CIRUGIA_ESPECIALISTAS = [
    'Cirugía general',
    'Traumatología',
    'Urología',
    'Oftalmología',
    'Otorrinolaringología',
    'Gastroenterología',
    'Neurología',
    'Oncología',
    'Otro',
  ];

  function emptyStep() {
    return { fecha: '', estado: ESTADO.SOLICITADO, activa: false };
  }

  function mapEstado(estado, hasFecha) {
    const map = {
      pendiente: ESTADO.SOLICITADO,
      solicitado: ESTADO.SOLICITADO,
      otorgado: ESTADO.OTORGADO,
      realizado: ESTADO.REALIZADO,
      completado: ESTADO.REALIZADO,
      no_quiere: ESTADO.NO_REQUIERE,
      no_requiere: ESTADO.NO_REQUIERE,
      programado: hasFecha ? ESTADO.REALIZADO : ESTADO.OTORGADO,
    };
    return map[estado] || ESTADO.SOLICITADO;
  }

  function normalizeStep(step) {
    const s = { ...emptyStep(), ...(step || {}) };
    s.estado = mapEstado(s.estado, !!s.fecha);
    return s;
  }

  function interconsultaAplicada(step) {
    return !!step?.activa;
  }

  function isStepActivo(step) {
    if (!step) return false;
    return step.estado === ESTADO.SOLICITADO || step.estado === ESTADO.OTORGADO;
  }

  function imagenTieneDatos(img) {
    return !!(img?.fecha || img?.detalle || (img?.estado && img.estado !== ESTADO.SOLICITADO));
  }

  function primerInterconsultaPendiente(turno) {
    for (const { key, label } of INTERCONSULTAS) {
      const s = turno.interconsultas?.[key];
      if (interconsultaAplicada(s) && isStepActivo(s)) return label;
    }
    return null;
  }

  function primerPrequirurgicoPendiente(turno) {
    for (const { key, label } of PREQUIRURGICOS) {
      if (isStepActivo(turno.prequirurgicos?.[key])) return label;
    }
    return null;
  }

  function primerEstudioPendiente(turno) {
    for (const img of turno.imagenes || []) {
      if (!imagenTieneDatos(img) || !isStepActivo(img)) continue;
      const base = tipoImagenLabel(img.tipo);
      if (img.detalle?.trim()) return `${base} — ${img.detalle.trim()}`;
      return base;
    }
    return null;
  }

  function emptyImagen() {
    return { tipo: 'tomografia', fecha: '', estado: ESTADO.SOLICITADO, detalle: '' };
  }

  function normalizeImagen(img) {
    const i = { ...emptyImagen(), ...(img || {}) };
    i.estado = mapEstado(i.estado, !!i.fecha);
    return i;
  }

  function emptyInterconsultas() {
    const o = {};
    INTERCONSULTAS.forEach(({ key }) => { o[key] = emptyStep(); });
    return o;
  }

  function emptyPrequirurgicos() {
    const o = {};
    PREQUIRURGICOS.forEach(({ key }) => { o[key] = emptyStep(); });
    return o;
  }

  function createEmpty(id) {
    return {
      id,
      paciente: '',
      patologia: '',
      urgencia: 'media',
      notas: '',
      interconsultas: emptyInterconsultas(),
      prequirurgicos: emptyPrequirurgicos(),
      imagenes: [emptyImagen()],
      turnoCirugia: { fecha: '', estado: ESTADO.SOLICITADO },
    };
  }

  function legacyStep(fecha, estadoLegacy) {
    const has = !!fecha;
    return {
      fecha: fecha || '',
      estado: mapEstado(estadoLegacy, has),
    };
  }

  function finalizeInterconsultas(interconsultas) {
    const o = {};
    INTERCONSULTAS.forEach(({ key }) => {
      const step = normalizeStep(interconsultas?.[key]);
      if (step.activa || step.fecha || (step.estado && step.estado !== ESTADO.SOLICITADO)) {
        step.activa = true;
      }
      o[key] = step;
    });
    return o;
  }

  function normalizePrequirurgicos(raw) {
    const o = emptyPrequirurgicos();
    PREQUIRURGICOS.forEach(({ key }) => {
      o[key] = normalizeStep(raw?.[key]);
    });
    return o;
  }

  function normalize(turno) {
    if (!turno || typeof turno !== 'object') return createEmpty(1);

    if (turno.v === 2 || turno.interconsultas) {
      const t = {
        ...createEmpty(turno.id),
        ...turno,
        interconsultas: finalizeInterconsultas(turno.interconsultas),
        prequirurgicos: normalizePrequirurgicos(turno.prequirurgicos),
        imagenes: Array.isArray(turno.imagenes) && turno.imagenes.length
          ? turno.imagenes.map(normalizeImagen)
          : [emptyImagen()],
        turnoCirugia: normalizeStep({ ...createEmpty().turnoCirugia, ...(turno.turnoCirugia || {}) }),
        v: 2,
      };
      delete t.turnoCirugia.especialista;
      return t;
    }

    const t = createEmpty(turno.id);
    t.paciente = turno.paciente || '';
    t.patologia = turno.patologia || '';
    t.urgencia = turno.urgencia || 'media';
    t.notas = turno.notas || '';

    t.prequirurgicos.cardiologia = legacyStep(turno.cardiologia, turno.estado);
    t.prequirurgicos.anestesista = legacyStep(turno.anestesista, turno.estado);
    t.prequirurgicos.laboratorio = legacyStep(turno.prequirurgico, turno.estado);

    INTERCONSULTAS.forEach(({ key }) => {
      const step = normalizeStep(t.interconsultas[key]);
      if (turno.especialista) {
        const espKey = INTERCONSULTAS.find(i =>
          i.label.toLowerCase() === String(turno.especialista).toLowerCase()
        );
        if (espKey?.key === key) {
          step.activa = true;
          step.estado = mapEstado(turno.estado, false);
        }
      }
      if (step.fecha || (step.estado && step.estado !== ESTADO.SOLICITADO)) {
        step.activa = true;
      }
      t.interconsultas[key] = step;
    });

    if (turno.imagenes) {
      t.imagenes = [{
        ...emptyImagen(),
        fecha: turno.imagenes,
        estado: mapEstado(turno.estado, true),
      }];
    }

    t.turnoCirugia = {
      fecha: '',
      estado: mapEstado(turno.estado, false),
    };

    t.interconsultas = finalizeInterconsultas(t.interconsultas);
    t.v = 2;
    return t;
  }

  function normalizeAll(list) {
    return (list || []).map(normalize);
  }

  function allSteps(turno) {
    const steps = [];
    INTERCONSULTAS.forEach(({ key }) => {
      const s = turno.interconsultas?.[key];
      if (interconsultaAplicada(s)) steps.push(s);
    });
    PREQUIRURGICOS.forEach(({ key }) => steps.push(turno.prequirurgicos?.[key]));
    (turno.imagenes || []).forEach(img => {
      if (img.fecha || img.estado !== ESTADO.SOLICITADO || img.detalle) steps.push(img);
    });
    steps.push(turno.turnoCirugia);
    return steps.filter(Boolean);
  }

  function resumen(turno) {
    const steps = allSteps(turno);
    const total = steps.length;
    const completados = steps.filter(s => s.estado === ESTADO.REALIZADO).length;
    const noQuiere = steps.some(s => s.estado === ESTADO.NO_REQUIERE);
    const pct = total ? Math.round((completados / total) * 100) : 0;

    let etapa = 'Interconsultas';
    const pendingInter = INTERCONSULTAS.some(({ key }) => {
      const s = turno.interconsultas?.[key];
      return interconsultaAplicada(s) && isStepActivo(s);
    });
    const hasInter = INTERCONSULTAS.some(({ key }) => interconsultaAplicada(turno.interconsultas?.[key]));
    const pendingPre = PREQUIRURGICOS.some(({ key }) => isStepActivo(turno.prequirurgicos?.[key]));
    const pendingImg = (turno.imagenes || []).some(i => imagenTieneDatos(i) && isStepActivo(i));
    const cir = turno.turnoCirugia || {};

    if (cir.estado === ESTADO.REALIZADO) etapa = 'Intervención quirúrgica acordada';
    else if (cir.estado === ESTADO.NO_REQUIERE) etapa = 'No requiere intervención';
    else if (!hasInter) etapa = 'Sin interconsultas asignadas';
    else if (!pendingInter && !pendingPre && !pendingImg) etapa = 'Turno intervención quirúrgica';
    else if (!pendingInter && !pendingPre) etapa = 'Diagnóstico por imágenes';
    else if (!pendingInter) etapa = 'Prequirúrgicos';
    else if (noQuiere) etapa = 'Con pasos rechazados';

    let etapaDetalle = null;
    if (cir.estado === ESTADO.REALIZADO && cir.fecha) {
      etapaDetalle = fmtDate(cir.fecha);
    } else if (hasInter && cir.estado !== ESTADO.NO_REQUIERE) {
      if (!pendingInter && !pendingPre && !pendingImg) {
        if (cir.fecha) etapaDetalle = fmtDate(cir.fecha);
      } else if (!pendingInter && !pendingPre) {
        etapaDetalle = primerEstudioPendiente(turno);
      } else if (!pendingInter) {
        etapaDetalle = primerPrequirurgicoPendiente(turno);
      } else {
        etapaDetalle = primerInterconsultaPendiente(turno);
      }
    }

    let estadoGeneral = 'en_proceso';
    if (completados === 0 && !noQuiere) estadoGeneral = 'pendiente';
    if (cir.estado === ESTADO.REALIZADO) estadoGeneral = 'completado';
    if (noQuiere || cir.estado === ESTADO.NO_REQUIERE) estadoGeneral = 'no_quiere';

    return { pct, etapa, etapaDetalle, estadoGeneral, completados, total, noQuiere };
  }

  function etapaTexto(resumenObj) {
    if (!resumenObj) return '';
    const { etapa, etapaDetalle } = resumenObj;
    return etapaDetalle ? `${etapa} · ${etapaDetalle}` : etapa;
  }

  function fmtDate(dateStr) {
    if (!dateStr) return '—';
    const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return dateStr;
  }

  function tipoImagenLabel(value) {
    return TIPOS_IMAGEN.find(t => t.value === value)?.label || value || '—';
  }

  const FASES = [
    { id: 'interconsultas', label: 'Interconsultas', short: 'Interconsultas', icon: 'ti-stethoscope' },
    { id: 'prequirurgicos', label: 'Prequirúrgicos', short: 'Prequirúrgicos', icon: 'ti-heart-rate-monitor' },
    { id: 'imagenes', label: 'Diagnóstico por imágenes', short: 'Imágenes', icon: 'ti-photo-scan' },
    { id: 'cirugia', label: 'Turno intervención quirúrgica', short: 'Intervención', icon: 'ti-calendar-event' },
  ];

  function estadoFase(steps) {
    if (!steps.length) return 'pendiente';
    if (steps.every(s => s.estado === ESTADO.REALIZADO)) return 'completado';
    if (steps.some(s => s.estado === ESTADO.NO_REQUIERE)) return 'no_quiere';
    if (steps.some(s => s.estado === ESTADO.OTORGADO || s.estado === ESTADO.REALIZADO || s.fecha)) return 'en_proceso';
    return 'pendiente';
  }

  function flujoDetalle(turno) {
    const t = normalize(turno);
    const fases = [
      {
        id: 'interconsultas',
        label: 'Interconsultas con especialistas',
        icon: 'ti-stethoscope',
        steps: INTERCONSULTAS.filter(({ key }) => interconsultaAplicada(t.interconsultas[key]))
          .map(({ key, label }) => ({
            key,
            label,
            fecha: t.interconsultas[key]?.fecha || '',
            estado: t.interconsultas[key]?.estado || ESTADO.SOLICITADO,
          })),
      },
      {
        id: 'prequirurgicos',
        label: 'Prequirúrgicos',
        icon: 'ti-heart-rate-monitor',
        steps: PREQUIRURGICOS.map(({ key, label }) => ({
          key,
          label,
          fecha: t.prequirurgicos[key]?.fecha || '',
          estado: t.prequirurgicos[key]?.estado || ESTADO.SOLICITADO,
        })),
      },
      {
        id: 'imagenes',
        label: 'Diagnóstico por imágenes',
        icon: 'ti-photo-scan',
        steps: (t.imagenes || [])
          .filter(img => img.fecha || img.estado !== ESTADO.SOLICITADO || img.detalle)
          .map((img, i) => ({
          key: `img-${i}`,
          label: tipoImagenLabel(img.tipo) + (img.detalle ? ` — ${img.detalle}` : ''),
          fecha: img.fecha || '',
          estado: img.estado || ESTADO.SOLICITADO,
        })),
      },
      {
        id: 'cirugia',
        label: 'Turno intervención quirúrgica',
        icon: 'ti-calendar-event',
        steps: [{
          key: 'cirugia',
          label: 'Fecha cirugía',
          fecha: t.turnoCirugia?.fecha || '',
          estado: t.turnoCirugia?.estado || ESTADO.SOLICITADO,
        }],
      },
    ];

    return fases.map(f => {
      const completados = f.steps.filter(s => s.estado === ESTADO.REALIZADO).length;
      const rechazados = f.steps.filter(s => s.estado === ESTADO.NO_REQUIERE).length;
      return {
        ...f,
        completados,
        rechazados,
        total: f.steps.length,
        estadoFase: estadoFase(f.steps),
      };
    });
  }

  function pasoIcon(estado) {
    if (estado === ESTADO.REALIZADO) return 'ti-check';
    if (estado === ESTADO.NO_REQUIERE) return 'ti-x';
    if (estado === ESTADO.OTORGADO) return 'ti-calendar-event';
    return 'ti-clock';
  }

  function pasoEstadoLabel(estado) {
    return ESTADO_LABELS[estado] || estado;
  }

  return {
    ESTADO,
    ESTADO_LABELS,
    ESTADOS_PASO,
    ESTADOS_INTERCONSULTA,
    INTERCONSULTAS,
    PREQUIRURGICOS,
    TIPOS_IMAGEN,
    CIRUGIA_ESPECIALISTAS,
    FASES,
    interconsultaAplicada,
    createEmpty,
    emptyStep,
    emptyImagen,
    normalize,
    normalizeAll,
    resumen,
    etapaTexto,
    allSteps,
    flujoDetalle,
    pasoIcon,
    pasoEstadoLabel,
    fmtDate,
    tipoImagenLabel,
  };
})();
