/* Módulo de control de turnos — interfaz visual por recorrido clínico */
const TurnosModule = (() => {
  const { ESTADO, ESTADO_LABELS, INTERCONSULTAS, PREQUIRURGICOS, TIPOS_IMAGEN,
    CIRUGIA_ESPECIALISTAS, FASES, createEmpty, normalize, resumen, flujoDetalle,
    pasoIcon, pasoEstadoLabel, fmtDate } = TurnosModel;

  let editingId = null;
  let expandedId = null;

  function canEditTurnos() {
    return typeof canEdit === 'function' && canEdit();
  }

  function urgenciaBadge(u) {
    const map = {
      alta: ['badge-urg', 'Urgente'],
      media: ['badge-warn', 'Moderada'],
      baja: ['badge-ok', 'Control'],
    };
    const [cls, label] = map[u] || ['badge-pend', u];
    return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
  }

  function estadoBadge(estado) {
    const map = {
      pendiente: 'badge-pend',
      en_proceso: 'badge-warn',
      completado: 'badge-ok',
      no_quiere: 'badge-urg',
    };
    const labels = {
      pendiente: 'Pendiente',
      en_proceso: 'En curso',
      completado: 'Completado',
      no_quiere: 'No quiere',
    };
    return `<span class="badge ${map[estado] || 'badge-pend'}"><span class="badge-dot"></span>${labels[estado] || estado}</span>`;
  }

  function pasoEstadoClass(estado) {
    const map = {
      pendiente: 'turno-paso--pend',
      completado: 'turno-paso--done',
      no_quiere: 'turno-paso--no',
    };
    return map[estado] || 'turno-paso--pend';
  }

  function faseEstadoClass(estado) {
    const map = {
      pendiente: 'turno-fase--pend',
      en_proceso: 'turno-fase--proc',
      completado: 'turno-fase--done',
      no_quiere: 'turno-fase--no',
    };
    return map[estado] || 'turno-fase--pend';
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

  function pipelineHtml(fases) {
    return `<div class="turno-pipeline" role="list" aria-label="Etapas del recorrido">
      ${fases.map((f, i) => {
        const meta = FASES.find(x => x.id === f.id) || {};
        const isLast = i === fases.length - 1;
        return `
        <div class="turno-pipeline__item ${faseEstadoClass(f.estadoFase)}" role="listitem" title="${escapeHtml(f.label)}: ${f.completados}/${f.total} realizados">
          <span class="turno-pipeline__dot"><i class="ti ${meta.icon || 'ti-point'}"></i></span>
          <span class="turno-pipeline__label">${escapeHtml(meta.short || f.label)}</span>
          <span class="turno-pipeline__count">${f.completados}/${f.total}</span>
          ${isLast ? '' : '<span class="turno-pipeline__line" aria-hidden="true"></span>'}
        </div>`;
      }).join('')}
    </div>`;
  }

  function pasoReadHtml(step) {
    const cls = pasoEstadoClass(step.estado);
    const icon = pasoIcon(step.estado);
    const fechaTxt = step.fecha ? fmtDate(step.fecha) : 'Sin fecha';
    const estadoTxt = pasoEstadoLabel(step.estado);
    return `
    <li class="turno-paso ${cls}">
      <span class="turno-paso__icon" aria-hidden="true"><i class="ti ${icon}"></i></span>
      <div class="turno-paso__body">
        <span class="turno-paso__nombre">${escapeHtml(step.label)}</span>
        <span class="turno-paso__meta">
          <span class="turno-paso__estado">${escapeHtml(estadoTxt)}</span>
          ${step.fecha ? `<span class="turno-paso__fecha">${escapeHtml(fechaTxt)}</span>` : ''}
        </span>
      </div>
    </li>`;
  }

  function faseDetailHtml(fase) {
    return `
    <section class="turno-fase ${faseEstadoClass(fase.estadoFase)}">
      <header class="turno-fase__head">
        <span class="turno-fase__icon"><i class="ti ${fase.icon}"></i></span>
        <div class="turno-fase__titles">
          <h4 class="turno-fase__title">${escapeHtml(fase.label)}</h4>
          <p class="turno-fase__sub">${f.completados} de ${f.total} realizados${f.rechazados ? ` · ${f.rechazados} rechazado(s)` : ''}</p>
        </div>
        <span class="turno-fase__badge">${f.completados}/${f.total}</span>
      </header>
      <ul class="turno-fase__pasos">
        ${fase.steps.map(pasoReadHtml).join('')}
      </ul>
    </section>`;
  }

  function cardDetailHtml(turno) {
    const fases = flujoDetalle(turno);
    const notas = turno.notas?.trim();
    return `
    <div class="turno-card__detail" id="turno-detail-${turno.id}">
      <div class="turno-card__detail-inner">
        ${fases.map(faseDetailHtml).join('')}
        ${notas ? `<div class="turno-card__notas"><i class="ti ti-notes"></i><span>${escapeHtml(notas)}</span></div>` : ''}
        <div class="turno-card__detail-actions">
          ${canEditTurnos() ? `<button type="button" class="btn btn-primary btn-sm" onclick="TurnosModule.openEdit(${turno.id})"><i class="ti ti-edit"></i> Editar registro</button>` : ''}
          <button type="button" class="btn btn-secondary btn-sm" onclick="TurnosModule.toggleExpand(${turno.id})"><i class="ti ti-chevron-up"></i> Cerrar</button>
        </div>
      </div>
    </div>`;
  }

  function cardHtml(turno) {
    const r = resumen(turno);
    const fases = flujoDetalle(turno);
    const cir = turno.turnoCirugia || {};
    const urgCls = turno.urgencia === 'alta' ? 'high' : turno.urgencia === 'media' ? 'med' : 'low';
    const isOpen = expandedId === turno.id;
    const cirResumen = cir.estado === ESTADO.COMPLETADO && cir.fecha
      ? `Cirugía: ${cir.especialista} · ${fmtDate(cir.fecha)}`
      : cir.estado === ESTADO.NO_QUIERE
        ? 'No quiere cirugía'
        : r.etapa;

    return `
    <article class="turno-card urgency-${urgCls}${isOpen ? ' turno-card--open' : ''}" role="listitem" data-id="${turno.id}">
      <header class="turno-card__head">
        <div class="turno-card__main">
          <div class="turno-card__identity">
            <h3 class="turno-card__paciente">${escapeHtml(turno.paciente)}</h3>
            <p class="turno-card__patologia">${escapeHtml(turno.patologia)}</p>
          </div>
          <div class="turno-card__badges">
            ${urgenciaBadge(turno.urgencia)}
            ${estadoBadge(r.estadoGeneral)}
          </div>
        </div>
        ${pipelineHtml(fases)}
        <div class="turno-card__footer">
          <div class="turno-card__progress-wrap">
            <div class="turno-progress turno-progress--lg" aria-label="Progreso ${r.pct}%">
              <div class="turno-progress__bar" style="width:${r.pct}%"></div>
            </div>
            <span class="turno-card__progress-text"><strong>${r.completados}</strong> de ${r.total} pasos · ${escapeHtml(cirResumen)}</span>
          </div>
          <div class="turno-card__actions">
            <button type="button" class="btn btn-secondary btn-sm turno-card__toggle" onclick="TurnosModule.toggleExpand(${turno.id})" aria-expanded="${isOpen}">
              <i class="ti ti-${isOpen ? 'chevron-up' : 'route'}"></i> ${isOpen ? 'Cerrar' : 'Ver recorrido'}
            </button>
            ${canEditTurnos() ? `<button type="button" class="edit-btn admin-edit-btn turno-card__edit" onclick="TurnosModule.openEdit(${turno.id})" aria-label="Editar"><i class="ti ti-edit"></i></button>` : ''}
          </div>
        </div>
      </header>
      ${isOpen ? cardDetailHtml(turno) : ''}
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

    list.innerHTML = rows.map(cardHtml).join('');
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
      .map(([k, lbl]) => `<option value="${k}"${e.estado === k ? ' selected' : ''}>${lbl}</option>`)
      .join('');
    return `
    <div class="turno-step-row ${pasoEstadoClass(e.estado)}" data-prefix="${prefix}">
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
    <div class="turno-step-row turno-imagen-row ${pasoEstadoClass(e.estado)}" data-idx="${idx}">
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
    row.classList.add(pasoEstadoClass(est));
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
