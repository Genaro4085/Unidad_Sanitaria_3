/* ── Laboratorios Module ── */

const LaboratoriosModule = (() => {
  const ESTADO_LABELS = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    informado: 'Informado',
  };

  const ESTADO_CLASS = {
    pendiente: 'badge-warn',
    en_proceso: 'badge-done',
    informado: 'badge-ok',
  };

  let filterSearch = '';
  let filterEstado = '';
  let editEnabled = false;
  let labEditId = null;
  let initialized = false;

  function medico(row) {
    return row.medicoSolicitante || row.medico || '—';
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return iso;
  }

  function ensureIds() {
    if (!appData.laboratorios) appData.laboratorios = [];
    if (!appData.nextLabId) {
      const ids = appData.laboratorios.map(r => r.id).filter(Boolean);
      appData.nextLabId = ids.length ? Math.max(...ids) + 1 : 1;
    }
  }

  function filtered() {
    return (appData.laboratorios || []).filter(row => {
      const q = filterSearch.toLowerCase();
      const med = medico(row).toLowerCase();
      const matchQ = !q
        || String(row.interno || '').toLowerCase().includes(q)
        || String(row.estudio || '').toLowerCase().includes(q)
        || med.includes(q);
      const matchE = !filterEstado || row.estado === filterEstado;
      return matchQ && matchE;
    });
  }

  function renderTable() {
    const tbody = document.getElementById('labTbody');
    const nodata = document.getElementById('labNodata');
    if (!tbody) return;

    const rows = filtered();
    const editHidden = editEnabled ? '' : ' hidden';

    if (!rows.length) {
      tbody.innerHTML = '';
      if (nodata) nodata.style.display = 'flex';
      return;
    }

    tbody.innerHTML = rows.map((row, i) => {
      const estado = row.estado || 'pendiente';
      const gap = i < rows.length - 1
        ? '<tr class="lab-gap" aria-hidden="true"><td colspan="6"></td></tr>'
        : '';
      return `
      <tr class="lab-row lab-row--${escapeHtml(estado)}">
        <td data-label="Interno">
          <div class="lab-patient">
            <span class="lab-patient__name">${escapeHtml(row.interno)}</span>
          </div>
        </td>
        <td data-label="Estudio"><span class="lab-estudio">${escapeHtml(row.estudio)}</span></td>
        <td data-label="Solicitud"><span class="lab-fecha date-text">${formatDate(row.solicitud)}</span></td>
        <td data-label="Médico"><span class="lab-medico">${escapeHtml(medico(row))}</span></td>
        <td data-label="Estado"><span class="badge ${ESTADO_CLASS[estado] || ''}">${ESTADO_LABELS[estado] || estado}</span></td>
        <td class="col-act" data-label="">
          <button type="button" class="edit-btn lab-edit-btn admin-edit-btn${editHidden}" onclick="LaboratoriosModule.openEdit(${row.id})" aria-label="Editar">
            <i class="ti ti-edit"></i>
          </button>
        </td>
      </tr>${gap}`;
    }).join('');

    if (nodata) nodata.style.display = 'none';
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function bindFilters() {
    const search = document.getElementById('labSearch');
    const estado = document.getElementById('labFilterEstado');
    if (search && !search.dataset.bound) {
      search.dataset.bound = '1';
      search.addEventListener('input', () => {
        filterSearch = search.value.trim();
        renderTable();
      });
    }
    if (estado && !estado.dataset.bound) {
      estado.dataset.bound = '1';
      estado.addEventListener('change', () => {
        filterEstado = estado.value;
        renderTable();
      });
    }
  }

  function openAdd() {
    if (!editEnabled) return;
    labEditId = null;
    document.getElementById('labModalTitle').textContent = 'Nuevo estudio de laboratorio';
    ['labInterno', 'labEstudio', 'labSolicitud', 'labMedico', 'labNotas'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('labEstado').value = 'pendiente';
    document.getElementById('labBtnDelete').classList.add('hidden');
    document.getElementById('labModal').classList.add('open');
    document.getElementById('labInterno').focus();
  }

  function openEdit(id) {
    if (!editEnabled) return;
    const row = appData.laboratorios.find(r => r.id === id);
    if (!row) return;
    labEditId = id;
    document.getElementById('labModalTitle').textContent = 'Editar estudio de laboratorio';
    document.getElementById('labInterno').value = row.interno || '';
    document.getElementById('labEstudio').value = row.estudio || '';
    document.getElementById('labSolicitud').value = row.solicitud || '';
    document.getElementById('labMedico').value = row.medicoSolicitante || row.medico || '';
    document.getElementById('labEstado').value = row.estado || 'pendiente';
    document.getElementById('labNotas').value = row.observaciones || row.notas || '';
    document.getElementById('labBtnDelete').classList.remove('hidden');
    document.getElementById('labModal').classList.add('open');
  }

  function closeModal() {
    document.getElementById('labModal')?.classList.remove('open');
  }

  function readForm() {
    return {
      interno: document.getElementById('labInterno').value.trim(),
      estudio: document.getElementById('labEstudio').value.trim(),
      solicitud: document.getElementById('labSolicitud').value,
      medicoSolicitante: document.getElementById('labMedico').value.trim(),
      estado: document.getElementById('labEstado').value,
      observaciones: document.getElementById('labNotas').value.trim(),
    };
  }

  function saveEntry() {
    if (!editEnabled) return;
    const entry = readForm();
    if (!entry.interno) {
      if (typeof showToast === 'function') showToast('Ingresá el interno', 'error');
      else alert('Ingresá el interno.');
      return;
    }
    if (!entry.estudio) {
      if (typeof showToast === 'function') showToast('Ingresá el estudio', 'error');
      else alert('Ingresá el estudio.');
      return;
    }

    ensureIds();

    if (labEditId) {
      const idx = appData.laboratorios.findIndex(r => r.id === labEditId);
      if (idx > -1) appData.laboratorios[idx] = { id: labEditId, ...entry };
      if (typeof logAudit === 'function') {
        logAudit({
          modulo: 'Laboratorios',
          tabla: 'laboratorios',
          accion: 'UPDATE',
          registroId: String(labEditId),
          detalle: `Se modificó el estudio "${entry.estudio}" de ${entry.interno}`,
        });
      }
    } else {
      const newId = appData.nextLabId++;
      appData.laboratorios.push({ id: newId, ...entry });
      if (typeof logAudit === 'function') {
        logAudit({
          modulo: 'Laboratorios',
          tabla: 'laboratorios',
          accion: 'INSERT',
          registroId: String(newId),
          detalle: `Se registró el estudio "${entry.estudio}" para ${entry.interno}`,
        });
      }
    }

    saveData();
    closeModal();
    renderTable();
    if (typeof showToast === 'function') showToast('Estudio guardado correctamente', 'success');
  }

  function deleteEntry() {
    if (!editEnabled || !labEditId) return;
    if (!confirm('¿Eliminar este estudio de laboratorio?')) return;
    const row = appData.laboratorios.find(r => r.id === labEditId);
    appData.laboratorios = appData.laboratorios.filter(r => r.id !== labEditId);
    saveData();
    if (typeof logAudit === 'function' && row) {
      logAudit({
        modulo: 'Laboratorios',
        tabla: 'laboratorios',
        accion: 'DELETE',
        registroId: String(labEditId),
        detalle: `Se eliminó el estudio "${row.estudio}" de ${row.interno}`,
      });
    }
    closeModal();
    renderTable();
    if (typeof showToast === 'function') showToast('Estudio eliminado', 'info');
  }

  function setEditMode(enabled) {
    editEnabled = !!enabled;
    if (initialized) renderTable();
  }

  function init() {
    if (typeof TurnosLabSync !== 'undefined') {
      TurnosLabSync.syncAll({ persist: true, silent: true });
    }
    ensureIds();
    if (!initialized) {
      bindFilters();
      document.getElementById('labModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
      });
      initialized = true;
    }
    const canEditLabs = typeof canEditLaboratorios === 'function'
      ? canEditLaboratorios()
      : (typeof canEdit === 'function' ? canEdit() : false);
    setEditMode(canEditLabs);
    renderTable();
  }

  function refresh() {
    if (initialized) renderTable();
  }

  function rowsForExport() {
    const headers = ['Interno', 'Estudio', 'Solicitud', 'Médico solicitante', 'Estado', 'Observaciones'];
    const rows = (appData.laboratorios || []).map(r => [
      r.interno,
      r.estudio,
      r.solicitud,
      medico(r) === '—' ? '' : medico(r),
      ESTADO_LABELS[r.estado] || r.estado,
      r.observaciones || r.notas || '',
    ]);
    return { headers, rows };
  }

  return {
    init, openAdd, openEdit, closeModal, saveEntry, deleteEntry,
    setEditMode, refresh, rowsForExport,
  };
})();
