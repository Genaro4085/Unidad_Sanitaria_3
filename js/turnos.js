/* Módulo de control de turnos — integrado al diseño del panel */
const TurnosModule = (() => {
  const { ESTADO, ESTADO_LABELS, INTERCONSULTAS, PREQUIRURGICOS, TIPOS_IMAGEN,
    CIRUGIA_ESPECIALISTAS, createEmpty, normalize, resumen, flujoDetalle, fmtDate } = TurnosModel;

  let editingId = null;
  let expandedId = null;

  const PASO_BADGE = {
    pendiente: ['badge-pend', 'Pendiente'],
    completado: ['badge-ok', 'Realizado'],
    no_quiere: ['badge-urg', 'No desea'],
  };

  const URG_BADGE = {
    alta: ['badge-urg', 'Urgente'],
    media: ['badge-warn', 'Moderada'],
    baja: ['badge-ok', 'Control'],
  };

  const GEN_BADGE = {
    pendiente: ['badge-pend', 'Pendiente'],
    en_proceso: ['badge-done', 'En trámite'],
    completado: ['badge-ok', 'Finalizado'],
    no_quiere: ['badge-urg', 'No desea'],
  };

  function canEditTurnos() {
    return typeof canEdit === 'function' && canEdit();
  }

  function badgeHtml(map, key) {
    const [cls, label] = map[key] || ['badge-pend', key];
    return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
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

  function pasoItemHtml(step) {
    const [cls] = PASO_BADGE[step.estado] || PASO_BADGE.pendiente;
    return `
    <li class="turno-phase__item">
      <span class="turno-phase__name">${escapeHtml(step.label)}</span>
      <span class="turno-phase__meta">
        <span class="badge ${cls}"><span class="badge-dot"></span>${PASO_BADGE[step.estado]?.[1] || step.estado}</span>
        <span class="date-text">${step.fecha ? fmtDate(step.fecha) : '—'}</span>
      </span>
    </li>`;
  }

  function phaseBlockHtml(fase) {
    const done = fase.completados ?? 0;
    const total = fase.total ?? 0;
    return `
    <div class="turno-phase">
      <div class="turno-phase__head">
        <h4 class="turno-phase__title"><i class="ti ${fase.icon}"></i> ${escapeHtml(fase.label)}</h4>
        <span class="turno-phase__count">${done}/${total}</span>
      </div>
      <ul class="turno-phase__list">${fase.steps.map(pasoItemHtml).join('')}</ul>
    </div>`;
  }

  function panelHtml(turno) {
    const fases = flujoDetalle(turno);
    const notas = turno.notas?.trim();
    return `
    <div class="turno-panel" id="turno-detail-${turno.id}">
      <div class="turno-panel__grid">
        ${fases.map(phaseBlockHtml).join('')}
      </div>
      ${notas ? `<p class="turno-panel__notas"><strong>Observaciones:</strong> ${escapeHtml(notas)}</p>` : ''}
      ${canEditTurnos() ? `
        <div class="turno-panel__foot">
          <button type="button" class="btn btn-secondary btn-sm" data-turno-edit="${turno.id}">
            <i class="ti ti-edit"></i> Editar registro
          </button>
        </div>` : ''}
    </div>`;
  }

  function rowPairHtml(turno) {
    const r = resumen(turno);
    const urgCls = turno.urgencia === 'alta' ? 'high' : turno.urgencia === 'media' ? 'med' : 'low';
    const isOpen = expandedId === turno.id;
    const editHidden = canEditTurnos() ? '' : ' hidden';

    return `
    <tr class="turno-row urgency-${urgCls}${isOpen ? ' turno-row--open' : ''}" data-turno-id="${turno.id}">
      <td class="col-expand" aria-hidden="true">
        <span class="turno-expand-icon"><i class="ti ti-chevron-${isOpen ? 'up' : 'down'}"></i></span>
      </td>
      <td>
        <strong>${escapeHtml(turno.paciente)}</strong>
        <br><span class="date-text">${escapeHtml(turno.patologia)}</span>
      </td>
      <td>${escapeHtml(r.etapa)}</td>
      <td>${badgeHtml(URG_BADGE, turno.urgencia)}</td>
      <td>${badgeHtml(GEN_BADGE, r.estadoGeneral)}</td>
      <td class="col-act">
        <button type="button" class="edit-btn admin-edit-btn${editHidden}" data-turno-edit="${turno.id}" aria-label="Editar">
          <i class="ti ti-edit"></i>
        </button>
      </td>
    </tr>
    ${isOpen ? `
    <tr class="turno-expand-row" data-turno-expand="${turno.id}">
      <td colspan="6">${panelHtml(turno)}</td>
    </tr>` : ''}`;
  }

  function render() {
    const tbody = document.getElementById('turnoTbody');
    const nodata = document.getElementById('turnoNodata');
    if (!tbody) return;

    const rows = getFiltered();

    if (!rows.length) {
      tbody.innerHTML = '';
      if (nodata) nodata.style.display = 'flex';
      return;
    }
    if (nodata) nodata.style.display = 'none';

    if (expandedId && !rows.some(t => t.id === expandedId)) expandedId = null;

    tbody.innerHTML = rows.map(rowPairHtml).join('');
  }

  function toggleExpand(id) {
    expandedId = expandedId === id ? null : id;
    render();
    if (expandedId) {
      requestAnimationFrame(() => {
        document.querySelector(`[data-turno-expand="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

    document.getElementById('turnoTbody')?.addEventListener('click', e => {
      const edit = e.target.closest('[data-turno-edit]');
      if (edit) {
        openEdit(Number(edit.dataset.turnoEdit));
        return;
      }
      const row = e.target.closest('tr.turno-row');
      if (row) toggleExpand(Number(row.dataset.turnoId));
    });

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
