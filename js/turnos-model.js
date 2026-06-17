/* Modelo de control de turnos quirúrgicos — US3 */
const TurnosModel = (() => {
  const ESTADO = {
    PENDIENTE: 'pendiente',
    SOLICITADO: 'solicitado',
    COMPLETADO: 'completado',
    NO_QUIERE: 'no_quiere',
  };

  const ESTADO_LABELS = {
    pendiente: 'Pendiente',
    solicitado: 'Solicitado',
    completado: 'Realizado',
    no_quiere: 'No desea',
    programado: 'Programado',
  };

  const ESTADOS_INTERCONSULTA = ['pendiente', 'solicitado', 'completado', 'no_quiere'];

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
    return { fecha: '', estado: ESTADO.PENDIENTE, activa: false };
  }

  function normalizeStep(step) {
    return { ...emptyStep(), ...(step || {}) };
  }

  function interconsultaAplicada(step) {
    return !!step?.activa;
  }

  function emptyImagen() {
    return { tipo: 'tomografia', fecha: '', estado: ESTADO.PENDIENTE, detalle: '' };
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
      turnoCirugia: { fecha: '', estado: ESTADO.PENDIENTE },
    };
  }

  function mapLegacyEstado(estado, hasFecha) {
    if (estado === 'completado') return ESTADO.COMPLETADO;
    if (estado === 'programado') return hasFecha ? ESTADO.COMPLETADO : ESTADO.PENDIENTE;
    return ESTADO.PENDIENTE;
  }

  function legacyStep(fecha, estadoLegacy) {
    const has = !!fecha;
    return {
      fecha: fecha || '',
      estado: mapLegacyEstado(estadoLegacy, has),
    };
  }

  function finalizeInterconsultas(interconsultas) {
    const o = {};
    INTERCONSULTAS.forEach(({ key }) => {
      const step = normalizeStep(interconsultas?.[key]);
      if (step.activa || step.fecha || (step.estado && step.estado !== ESTADO.PENDIENTE)) {
        step.activa = true;
      }
      o[key] = step;
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
        prequirurgicos: { ...emptyPrequirurgicos(), ...(turno.prequirurgicos || {}) },
        imagenes: Array.isArray(turno.imagenes) && turno.imagenes.length
          ? turno.imagenes.map(img => ({ ...emptyImagen(), ...img }))
          : [emptyImagen()],
        turnoCirugia: { ...createEmpty().turnoCirugia, ...(turno.turnoCirugia || {}) },
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
          step.estado = mapLegacyEstado(turno.estado, false);
        }
      }
      if (step.fecha || (step.estado && step.estado !== ESTADO.PENDIENTE)) {
        step.activa = true;
      }
      t.interconsultas[key] = step;
    });

    if (turno.imagenes) {
      t.imagenes = [{
        ...emptyImagen(),
        fecha: turno.imagenes,
        estado: mapLegacyEstado(turno.estado, true),
      }];
    }

    t.turnoCirugia = {
      fecha: '',
      estado: mapLegacyEstado(turno.estado, false),
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
      if (img.fecha || img.estado !== ESTADO.PENDIENTE || img.detalle) steps.push(img);
    });
    steps.push(turno.turnoCirugia);
    return steps.filter(Boolean);
  }

  function resumen(turno) {
    const steps = allSteps(turno);
    const total = steps.length;
    const completados = steps.filter(s => s.estado === ESTADO.COMPLETADO).length;
    const noQuiere = steps.some(s => s.estado === ESTADO.NO_QUIERE);
    const pct = total ? Math.round((completados / total) * 100) : 0;

    let etapa = 'Interconsultas';
    const pendingInter = INTERCONSULTAS.some(({ key }) => {
      const s = turno.interconsultas?.[key];
      return interconsultaAplicada(s) && (s.estado === ESTADO.PENDIENTE || s.estado === ESTADO.SOLICITADO);
    });
    const hasInter = INTERCONSULTAS.some(({ key }) => interconsultaAplicada(turno.interconsultas?.[key]));
    const pendingPre = PREQUIRURGICOS.some(({ key }) =>
      turno.prequirurgicos?.[key]?.estado === ESTADO.PENDIENTE
    );
    const pendingImg = (turno.imagenes || []).some(i => i.estado === ESTADO.PENDIENTE);
    const cir = turno.turnoCirugia || {};

    if (cir.estado === ESTADO.COMPLETADO) etapa = 'Intervención quirúrgica acordada';
    else if (cir.estado === ESTADO.NO_QUIERE) etapa = 'No desea intervención';
    else if (!hasInter) etapa = 'Sin interconsultas asignadas';
    else if (!pendingInter && !pendingPre && !pendingImg) etapa = 'Turno intervención quirúrgica';
    else if (!pendingInter && !pendingPre) etapa = 'Diagnóstico por imágenes';
    else if (!pendingInter) etapa = 'Prequirúrgicos';
    else if (noQuiere) etapa = 'Con pasos rechazados';

    let estadoGeneral = 'en_proceso';
    if (completados === 0 && !noQuiere) estadoGeneral = 'pendiente';
    if (cir.estado === ESTADO.COMPLETADO) estadoGeneral = 'completado';
    if (noQuiere || cir.estado === ESTADO.NO_QUIERE) estadoGeneral = 'no_quiere';

    return { pct, etapa, estadoGeneral, completados, total, noQuiere };
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
    if (steps.every(s => s.estado === ESTADO.COMPLETADO)) return 'completado';
    if (steps.some(s => s.estado === ESTADO.NO_QUIERE)) return 'no_quiere';
    if (steps.some(s => s.estado === ESTADO.SOLICITADO || s.estado === ESTADO.COMPLETADO || s.fecha)) return 'en_proceso';
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
            estado: t.interconsultas[key]?.estado || ESTADO.PENDIENTE,
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
          estado: t.prequirurgicos[key]?.estado || ESTADO.PENDIENTE,
        })),
      },
      {
        id: 'imagenes',
        label: 'Diagnóstico por imágenes',
        icon: 'ti-photo-scan',
        steps: (t.imagenes || [])
          .filter(img => img.fecha || img.estado !== ESTADO.PENDIENTE || img.detalle)
          .map((img, i) => ({
          key: `img-${i}`,
          label: tipoImagenLabel(img.tipo) + (img.detalle ? ` — ${img.detalle}` : ''),
          fecha: img.fecha || '',
          estado: img.estado || ESTADO.PENDIENTE,
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
          estado: t.turnoCirugia?.estado || ESTADO.PENDIENTE,
        }],
      },
    ];

    return fases.map(f => {
      const completados = f.steps.filter(s => s.estado === ESTADO.COMPLETADO).length;
      const rechazados = f.steps.filter(s => s.estado === ESTADO.NO_QUIERE).length;
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
    if (estado === ESTADO.COMPLETADO) return 'ti-check';
    if (estado === ESTADO.NO_QUIERE) return 'ti-x';
    return 'ti-clock';
  }

  function pasoEstadoLabel(estado) {
    return ESTADO_LABELS[estado] || estado;
  }

  return {
    ESTADO,
    ESTADO_LABELS,
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
    allSteps,
    flujoDetalle,
    pasoIcon,
    pasoEstadoLabel,
    fmtDate,
    tipoImagenLabel,
  };
})();
