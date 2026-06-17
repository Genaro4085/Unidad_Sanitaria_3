/* Módulo de control de turnos — vista institucional minimalista */
const TurnosModule = (() => {
  const { ESTADO, ESTADO_LABELS, INTERCONSULTAS, PREQUIRURGICOS, TIPOS_IMAGEN,
    CIRUGIA_ESPECIALISTAS, createEmpty, normalize, resumen, flujoDetalle, fmtDate } = TurnosModel;

  let editingId = null;
  let expandedId = null;

  function canEditTurnos() {
    return typeof canEdit === 'function' && canEdit();
  }

  /** Texto claro para lectura sin interpretar colores */
  function estadoLegible(estado) {
    const map = {
      pendiente: 'Pendiente',
      completado: 'Realizado',
      no_quiere: 'No desea',
    };
    return map[estado] || estado;
  }

  function urgenciaTexto(u) {
    const map = { alta: 'Urgente', media: 'Moderada', baja: 'Control' };
    return map[u] || u;
  }

  function situacionTexto(r, turno) {
    if (r.estadoGeneral === 'completado') return 'Recorrido completo — cirugía acordada';
    if (r.estadoGeneral === 'no_quiere') return 'Interno con pasos no deseados';
    if (r.estadoGeneral === 'pendiente') return 'Sin turnos registrados aún';
    return r.etapa;
  }

  function pasoEstadoClass(estado) {
    const map = {
      pendiente: 'turno-tabla__fila--pend',
      completado: 'turno-tabla__fila--done',
      no_quiere: 'turno-tabla__fila--no',
    };
    return map[estado] || '';
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function modalPasoClass(estado) {
    const map = {
      pendiente: 'turno-paso--pend',
      completado: 'turno-paso--done',
      no_quiere: 'turno-paso--no',
    };
    return map[estado] || 'turno-paso--pend';
  }

  function getFiltered() {
    const q = (document.getElementById('turnoSearch')?.value || '').toLowerCase();
    const urg = document.getElementById('turnoFilterUrg')?.value || '';
    const est = document.getElementById('turnoFilterEst')?.value || '';
    let rows = (appData.turnosUrgentes || []).map(normalize);

    if (q) {
      rows = rows.filter(t =>
        (t.paciente || '').toLowerCase().includes(q) ||
        (t.patologia || '').toLowerCase().includes(q)
      );
    }
    if (urg) rows = rows.filter(t => t.urgencia === urg);
    if (est) rows = rows.filter(t => resumen(t).estadoGeneral === est);

    const urgOrder = { alta: 0, media: 1, baja: 2 };
    rows.sort((a, b) => (urgOrder[a.urgencia] ?? 9) - (urgOrder[b.urgencia] ?? 9));
    return rows;
  }

  function tablaPasosHtml(steps, col1 = 'Concepto') {
    if (!steps.length) {
      return `<p class="turno-detalle__vacio">Sin registros en esta etapa.</p>`;
    }
    return `
    <table class="turno-tabla">
      <thead>
        <tr><th>${col1}</th><th>Estado</th><th>Fecha</th></tr>
      </thead>
      <tbody>
        ${steps.map(s => `
        <tr class="${pasoEstadoClass(s.estado)}">
          <td>${escapeHtml(s.label)}</td>
          <td><strong>${escapeHtml(estadoLegible(s.estado))}</strong></td>
          <td>${s.fecha ? escapeHtml(fmtDate(s.fecha)) : '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  }

  function detalleHtml(turno) {
    const fases = flujoDetalle(turno);
    const notas = turno.notas?.trim();
    const secciones = [
      { n: 1, titulo: 'Interconsultas con especialistas', steps: fases.find(f => f.id === 'interconsultas')?.steps || [], col: 'Especialidad' },
      { n: 2, titulo: 'Prequirúrgicos (cardiología, anestesista, laboratorio)', steps: fases.find(f => f.id === 'prequirurgicos')?.steps || [], col: 'Estudio' },
      { n: 3, titulo: 'Diagnóstico por imágenes', steps: fases.find(f => f.id === 'imagenes')?.steps || [], col: 'Estudio' },
      { n: 4, titulo: 'Turno de cirugía', steps: fases.find(f => f.id === 'cirugia')?.steps || [], col: 'Especialista' },
    ];

    return `
    <div class="turno-detalle" id="turno-detail-${turno.id}">
      <p class="turno-detalle__intro">Detalle del recorrido. Estados posibles: <strong>Pendiente</strong>, <strong>Realizado</strong> o <strong>No desea</strong>.</p>
      ${secciones.map(sec => `
        <section class="turno-detalle__bloque">
          <h4 class="turno-detalle__titulo">${sec.n}. ${escapeHtml(sec.titulo)}</h4>
          ${tablaPasosHtml(sec.steps, sec.col)}
        </section>
      `).join('')}
      ${notas ? `<div class="turno-detalle__notas"><span class="turno-fila__label">Observaciones</span><p>${escapeHtml(notas)}</p></div>` : ''}
      ${canEditTurnos() ? `<p class="turno-detalle__edit"><button type="button" class="btn btn-secondary" onclick="TurnosModule.openEdit(${turno.id})"><i class="ti ti-edit"></i> Modificar datos</button></p>` : ''}
    </div>`;
  }

  function filaHtml(turno) {
    const r = resumen(turno);
    const isOpen = expandedId === turno.id;
    const urgCls = turno.urgencia === 'alta' ? 'turno-fila--urg-alta' : '';

    return `
    <article class="turno-fila ${urgCls}${isOpen ? ' turno-fila--open' : ''}" role="listitem" data-id="${turno.id}">
      <div class="turno-fila__resumen">
        <div class="turno-fila__col">
          <span class="turno-fila__label">Interno</span>
          <span class="turno-fila__valor turno-fila__valor--nombre">${escapeHtml(turno.paciente)}</span>
        </div>
        <div class="turno-fila__col">
          <span class="turno-fila__label">Patología</span>
          <span class="turno-fila__valor">${escapeHtml(turno.patologia)}</span>
        </div>
        <div class="turno-fila__col">
          <span class="turno-fila__label">Prioridad</span>
          <span class="turno-fila__valor">${escapeHtml(urgenciaTexto(turno.urgencia))}</span>
        </div>
        <div class="turno-fila__col turno-fila__col--wide">
          <span class="turno-fila__label">Situación actual</span>
          <span class="turno-fila__valor">${escapeHtml(situacionTexto(r, turno))}</span>
        </div>
      </div>
      <div class="turno-fila__acciones">
        <button type="button" class="turno-btn-detalle" onclick="TurnosModule.toggleExpand(${turno.id})" aria-expanded="${isOpen}">
          ${isOpen ? 'Ocultar detalle' : 'Ver estado del recorrido'}
        </button>
      </div>
      ${isOpen ? detalleHtml(turno) : ''}
    </article>`;
  }

  function render() {
    const list = document.getElementById('turnosList');
    const nodata = document.getElementById('turnoNodata');
    if (!list) return;

    const rows = getFiltered();

    if (!rows.length) {
      list.innerHTML = '';
      if (nodata) nodata.style.display = 'flex';
      return;
    }
    if (nodata) nodata.style.display = 'none';

    if (expandedId && !rows.some(t => t.id === expandedId)) expandedId = null;

    list.innerHTML = rows.map(filaHtml).join('');
  }

  function toggleExpand(id) {
    expandedId = expandedId === id ? null : id;
    render();
    if (expandedId) {
      requestAnimationFrame(() => {
        document.getElementById(`turno-detail-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  /* ——— Modal edición (admin) ——— */

  function stepRowHtml(prefix, label, step) {
    const e = step || TurnosModel.emptyStep();
    const opts = Object.entries(ESTADO_LABELS)
      .filter(([k]) => k !== 'programado')
      .map(([k, lbl]) => {
        const txt = k === 'completado' ? 'Realizado' : k === 'no_quiere' ? 'No desea' : lbl;
        return `<option value="${k}"${e.estado === k ? ' selected' : ''}>${txt}</option>`;
      })
      .join('');
    return `
    <div class="turno-step-row ${modalPasoClass(e.estado)}" data-prefix="${prefix}">
      <span class="turno-step-label">${escapeHtml(label)}</span>
      <input type="date" class="form-input turno-step-fecha" data-field="fecha" value="${escapeHtml(e.fecha || '')}">
      <select class="form-select turno-step-estado" data-field="estado">${opts}</select>
    </div>`;
  }

  function buildInterconsultasGrid(turno) {
    const grid = document.getElementById('turnoInterconsultasGrid');
    if (!grid) return;
    grid.innerHTML = INTERCONSULTAS.map(({ key, label }) =>
      stepRowHtml(`interconsultas.${key}`, label, turno.interconsultas[key])
    ).join('');
  }

  function buildPrequirurgicosGrid(turno) {
    const grid = document.getElementById('turnoPrequirurgicosGrid');
    if (!grid) return;
    grid.innerHTML = PREQUIRURGICOS.map(({ key, label }) =>
      stepRowHtml(`prequirurgicos.${key}`, label, turno.prequirurgicos[key])
    ).join('');
  }

  function imagenRowHtml(img, idx) {
    const e = img || TurnosModel.emptyImagen();
    const tipoOpts = TIPOS_IMAGEN.map(t =>
      `<option value="${t.value}"${e.tipo === t.value ? ' selected' : ''}>${t.label}</option>`
    ).join('');
    const estOpts = Object.entries(ESTADO_LABELS)
      .filter(([k]) => k !== 'programado')
      .map(([k, lbl]) => `<option value="${k}"${e.estado === k ? ' selected' : ''}>${lbl}</option>`)
      .join('');
    const removeBtn = idx > 0
      ? `<button type="button" class="btn btn-sm btn-ghost turno-img-remove" aria-label="Quitar estudio"><i class="ti ti-trash"></i></button>`
      : '';
    return `
    <div class="turno-step-row turno-imagen-row ${modalPasoClass(e.estado)}" data-idx="${idx}">
      <select class="form-select turno-img-tipo" data-field="tipo">${tipoOpts}</select>
      <input type="text" class="form-input turno-img-detalle" data-field="detalle" placeholder="Detalle (opcional)" value="${escapeHtml(e.detalle || '')}">
      <input type="date" class="form-input turno-step-fecha" data-field="fecha" value="${escapeHtml(e.fecha || '')}">
      <select class="form-select turno-step-estado" data-field="estado">${estOpts}</select>
      ${removeBtn}
    </div>`;
  }

  function buildImagenesList(turno) {
    const list = document.getElementById('turnoImagenesList');
    if (!list) return;
    const imgs = turno.imagenes?.length ? turno.imagenes : [TurnosModel.emptyImagen()];
    list.innerHTML = imgs.map((img, i) => imagenRowHtml(img, i)).join('');
  }

  function fillModal(turno) {
    document.getElementById('turnoPaciente').value = turno.paciente || '';
    document.getElementById('turnoPatologia').value = turno.patologia || '';
    document.getElementById('turnoUrgencia').value = turno.urgencia || 'media';
    document.getElementById('turnoNotas').value = turno.notas || '';

    const cir = turno.turnoCirugia || {};
    document.getElementById('turnoCirEsp').value = cir.especialista || CIRUGIA_ESPECIALISTAS[0];
    document.getElementById('turnoCirFecha').value = cir.fecha || '';
    document.getElementById('turnoCirEstado').value = cir.estado || ESTADO.PENDIENTE;

    buildInterconsultasGrid(turno);
    buildPrequirurgicosGrid(turno);
    buildImagenesList(turno);
  }

  function openModal(id) {
    editingId = id;
    const turno = id
      ? normalize((appData.turnosUrgentes || []).find(t => t.id === id))
      : createEmpty(Date.now());
    fillModal(turno);
    document.getElementById('turnoModalTitle').textContent = id ? 'Editar control de turno' : 'Nuevo control de turno';
    const delBtn = document.getElementById('turnoModalDelete');
    if (delBtn) delBtn.style.display = id ? '' : 'none';
    document.getElementById('turnoModal').classList.add('open');
  }

  function openAdd() {
    if (!canEditTurnos()) return;
    openModal(null);
  }

  function openEdit(id) {
    if (!canEditTurnos()) return;
    openModal(id);
  }

  function closeModal() {
    document.getElementById('turnoModal')?.classList.remove('open');
    editingId = null;
  }

  function readStepFromRow(row) {
    return {
      fecha: row.querySelector('[data-field="fecha"]')?.value || '',
      estado: row.querySelector('[data-field="estado"]')?.value || ESTADO.PENDIENTE,
    };
  }

  function collectFromModal() {
    const turno = editingId
      ? normalize((appData.turnosUrgentes || []).find(t => t.id === editingId) || createEmpty(editingId))
      : createEmpty(Date.now());

    turno.paciente = document.getElementById('turnoPaciente').value.trim();
    turno.patologia = document.getElementById('turnoPatologia').value.trim();
    turno.urgencia = document.getElementById('turnoUrgencia').value;
    turno.notas = document.getElementById('turnoNotas').value.trim();

    document.querySelectorAll('#turnoInterconsultasGrid .turno-step-row').forEach(row => {
      const prefix = row.dataset.prefix;
      const key = prefix?.replace('interconsultas.', '');
      if (key) turno.interconsultas[key] = readStepFromRow(row);
    });

    document.querySelectorAll('#turnoPrequirurgicosGrid .turno-step-row').forEach(row => {
      const prefix = row.dataset.prefix;
      const key = prefix?.replace('prequirurgicos.', '');
      if (key) turno.prequirurgicos[key] = readStepFromRow(row);
    });

    turno.imagenes = [];
    document.querySelectorAll('#turnoImagenesList .turno-imagen-row').forEach(row => {
      turno.imagenes.push({
        tipo: row.querySelector('[data-field="tipo"]')?.value || 'tomografia',
        detalle: row.querySelector('[data-field="detalle"]')?.value?.trim() || '',
        fecha: row.querySelector('[data-field="fecha"]')?.value || '',
        estado: row.querySelector('[data-field="estado"]')?.value || ESTADO.PENDIENTE,
      });
    });
    if (!turno.imagenes.length) turno.imagenes = [TurnosModel.emptyImagen()];

    turno.turnoCirugia = {
      especialista: document.getElementById('turnoCirEsp').value,
      fecha: document.getElementById('turnoCirFecha').value,
      estado: document.getElementById('turnoCirEstado').value,
    };

    turno.v = 2;
    return turno;
  }

  function saveTurno() {
    if (!canEditTurnos()) return;
    const turno = collectFromModal();
    if (!turno.paciente || !turno.patologia) {
      alert('Complete interno y patología.');
      return;
    }

    if (!editingId) {
      const newId = appData.nextTurnoId || ((appData.turnosUrgentes || []).reduce((m, t) => Math.max(m, t.id || 0), 0) + 1);
      turno.id = newId;
      appData.nextTurnoId = newId + 1;
      appData.turnosUrgentes = appData.turnosUrgentes || [];
      appData.turnosUrgentes.push(turno);
      if (typeof logAudit === 'function') {
        logAudit({ modulo: 'Turnos', tabla: 'turnos_urgentes', accion: 'INSERT', registroId: String(newId), detalle: `Se registró control de turno para ${turno.paciente}` });
      }
    } else {
      const idx = appData.turnosUrgentes.findIndex(t => t.id === editingId);
      if (idx >= 0) appData.turnosUrgentes[idx] = turno;
      expandedId = editingId;
      if (typeof logAudit === 'function') {
        logAudit({ modulo: 'Turnos', tabla: 'turnos_urgentes', accion: 'UPDATE', registroId: String(editingId), detalle: `Se modificó control de turno de ${turno.paciente}` });
      }
    }

    saveData();
    closeModal();
    render();
    if (typeof DashboardModule !== 'undefined' && currentView === 'dashboard') DashboardModule.render();
    updateAuthUI();
  }

  function deleteTurno() {
    if (!canEditTurnos() || !editingId) return;
    if (!confirm('¿Eliminar este registro de turno?')) return;
    const t = appData.turnosUrgentes.find(x => x.id === editingId);
    appData.turnosUrgentes = (appData.turnosUrgentes || []).filter(x => x.id !== editingId);
    if (expandedId === editingId) expandedId = null;
    saveData();
    if (typeof logAudit === 'function' && t) {
      logAudit({ modulo: 'Turnos', tabla: 'turnos_urgentes', accion: 'DELETE', registroId: String(editingId), detalle: `Se eliminó control de turno de ${t.paciente}` });
    }
    closeModal();
    render();
    if (typeof DashboardModule !== 'undefined' && currentView === 'dashboard') DashboardModule.render();
    updateAuthUI();
  }

  function updateStepRowClass(row) {
    const est = row.querySelector('[data-field="estado"]')?.value;
    row.classList.remove('turno-paso--pend', 'turno-paso--done', 'turno-paso--no');
    row.classList.add(modalPasoClass(est));
  }

  function bindEvents() {
    const cirSel = document.getElementById('turnoCirEsp');
    if (cirSel && !cirSel.options.length) {
      cirSel.innerHTML = CIRUGIA_ESPECIALISTAS.map(e => `<option>${e}</option>`).join('');
    }

    document.getElementById('turnoModalClose')?.addEventListener('click', closeModal);
    document.getElementById('turnoModalCancel')?.addEventListener('click', closeModal);
    document.getElementById('turnoModalSave')?.addEventListener('click', saveTurno);
    document.getElementById('turnoModalDelete')?.addEventListener('click', deleteTurno);
    document.getElementById('turnoModal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('turnoSearch')?.addEventListener('input', render);
    document.getElementById('turnoFilterUrg')?.addEventListener('change', render);
    document.getElementById('turnoFilterEst')?.addEventListener('change', render);

    document.getElementById('btnTurnoAddImg')?.addEventListener('click', () => {
      const list = document.getElementById('turnoImagenesList');
      if (!list) return;
      const idx = list.querySelectorAll('.turno-imagen-row').length;
      list.insertAdjacentHTML('beforeend', imagenRowHtml(TurnosModel.emptyImagen(), idx));
    });

    document.getElementById('turnoImagenesList')?.addEventListener('click', e => {
      const btn = e.target.closest('.turno-img-remove');
      if (!btn) return;
      btn.closest('.turno-imagen-row')?.remove();
    });

    document.getElementById('turnoModal')?.addEventListener('change', e => {
      const row = e.target.closest('.turno-step-row');
      if (row && e.target.matches('[data-field="estado"]')) updateStepRowClass(row);
    });
  }

  function ensureNormalized() {
    if (!appData.turnosUrgentes?.length) return;
    const migrated = TurnosModel.normalizeAll(appData.turnosUrgentes);
    const changed = migrated.some((t, i) => t.v !== appData.turnosUrgentes[i]?.v);
    appData.turnosUrgentes = migrated;
    if (changed) saveData();
  }

  function show() {
    ensureNormalized();
    render();
  }

  function refresh() {
    render();
  }

  document.addEventListener('DOMContentLoaded', bindEvents);

  return { render, show, refresh, toggleExpand, openAdd, openEdit, closeModal, saveTurno, deleteTurno };
})();
