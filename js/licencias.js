/* ── Licencias y Vacaciones Module ──
 * Desactivado en el panel: js/features.js → US3Features.licencias = true para restaurar.
 */

const LicenciasModule = (() => {
  const TOTAL_DIAS = 30;

  const MSG_ORGANIZATIVO = 'Esta aplicación tiene fines exclusivamente organizativos y no constituye la presentación formal de una licencia. Una vez registrada, deberá informar la misma a su superior correspondiente.';

  const MSG_MEDICO_CONFLICTO = (nombre) =>
    `La licencia no puede registrarse debido a que existe otra licencia del personal médico (${nombre}) en el mismo período. Para evitar superposiciones, consulte con su superior antes de realizar una nueva solicitud.`;

  /* Personal médico: se deriva de agentes con esMedico en licencias-default.js */

  const PERSONAL_MEDICO_KEY = 'us3_personal_medico';
  const LICENCIAS_STORAGE_KEY = 'us3_licencias_v3';

  const AVATAR_COLORS = [
    { bg: '#E5F9FE', text: '#0276BC' }, { bg: '#E5F9FE', text: '#038FC9' },
    { bg: '#E5F9FE', text: '#0BA8D6' }, { bg: '#f0f9fc', text: '#313F5F' },
    { bg: '#E5F9FE', text: '#0276BC' }, { bg: '#f0f9fc', text: '#038FC9' },
    { bg: '#E5F9FE', text: '#0BA8D6' }, { bg: '#f4fafc', text: '#92A1B4' },
  ];

  let data = [];
  let nextId = 1;
  let editEnabled = true;
  let initialized = false;
  let useSupabase = false;
  let loading = false;

  function getDefaultLicencias() {
    if (Array.isArray(window.US3_LICENCIAS_DEFAULT) && window.US3_LICENCIAS_DEFAULT.length) {
      return structuredClone(window.US3_LICENCIAS_DEFAULT);
    }
    return [];
  }

  function loadLicenciasLocal() {
    try {
      const saved = localStorage.getItem(LICENCIAS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { data: parsed.data || getDefaultLicencias(), nextId: parsed.nextId || 1 };
      }
    } catch (_) { /* ignore */ }
    const defaults = getDefaultLicencias();
    return { data: defaults, nextId: defaults.length ? Math.max(...defaults.map(d => d.id)) + 1 : 1 };
  }

  function saveLicenciasLocal() {
    localStorage.setItem(LICENCIAS_STORAGE_KEY, JSON.stringify({ data, nextId }));
    if (typeof PlatformSync !== 'undefined') PlatformSync.schedulePush();
  }

  async function refreshFromSupabase() {
    if (typeof DataService === 'undefined') {
      useSupabase = false;
      const loaded = loadLicenciasLocal();
      data = loaded.data;
      nextId = loaded.nextId;
      return;
    }

    useSupabase = await DataService.isOnline();
    if (!useSupabase) {
      const loaded = loadLicenciasLocal();
      data = loaded.data;
      nextId = loaded.nextId;
      if (typeof showToast === 'function') {
        showToast('Licencias en caché local — conectá Supabase para sincronizar', 'error', 5000);
      }
      return;
    }

    await DataService.seedLicenciasIfEmpty(getDefaultLicencias());
    data = await DataService.listLicencias() || [];
    nextId = data.length ? Math.max(...data.map(d => d.id)) + 1 : 1;
    saveLicenciasLocal();
  }

  function normalizeName(name) {
    return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function loadPersonalMedico() {
    try {
      const saved = localStorage.getItem(PERSONAL_MEDICO_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) { /* ignore */ }
    const fromDefaults = getDefaultLicencias()
      .filter(l => l.esMedico)
      .map(l => l.nombre);
    return [...new Set(fromDefaults)];
  }

  let personalMedico = loadPersonalMedico();

  function isPersonalMedico(nombre, esMedicoFlag) {
    if (esMedicoFlag === true) return true;
    if (esMedicoFlag === false) return false;
    const n = normalizeName(nombre);
    return personalMedico.some(m => normalizeName(m) === n);
  }

  function datesOverlap(desdeA, hastaA, desdeB, hastaB) {
    if (!desdeA || !hastaA || !desdeB || !hastaB) return false;
    const a0 = new Date(desdeA + 'T12:00:00');
    const a1 = new Date(hastaA + 'T12:00:00');
    const b0 = new Date(desdeB + 'T12:00:00');
    const b1 = new Date(hastaB + 'T12:00:00');
    return a0 <= b1 && b0 <= a1;
  }

  function findMedicoConflict(entry, excludeId) {
    if (!isPersonalMedico(entry.nombre, entry.esMedico)) return null;
    if (!entry.desde || !entry.hasta) return null;

    const self = normalizeName(entry.nombre);
    for (const lic of data) {
      if (excludeId && lic.id === excludeId) continue;
      if (!isPersonalMedico(lic.nombre, lic.esMedico)) continue;
      if (normalizeName(lic.nombre) === self) continue;
      if (!lic.desde || !lic.hasta) continue;
      if (datesOverlap(entry.desde, entry.hasta, lic.desde, lic.hasta)) {
        return lic.nombre;
      }
    }
    return null;
  }

  function syncMedicoCheckboxFromName() {
    const nombre = document.getElementById('licNombre')?.value.trim();
    const cb = document.getElementById('licEsMedico');
    if (!cb || !nombre) return;
    if (isPersonalMedico(nombre, null)) cb.checked = true;
  }

  function updateFormAlerts() {
    const errEl = document.getElementById('licErrorBanner');
    const infoEl = document.getElementById('licInfoBanner');
    if (!errEl || !infoEl) return;

    const nombre = document.getElementById('licNombre').value.trim();
    const esMedico = document.getElementById('licEsMedico').checked;
    const desde = document.getElementById('licDesde').value;
    const hasta = document.getElementById('licHasta').value;
    const editId = parseInt(document.getElementById('licEditId').value) || null;

    errEl.classList.add('hidden');
    infoEl.classList.add('hidden');

    if (!nombre) return;

    const draft = { nombre, esMedico, desde, hasta };
    const conflicto = findMedicoConflict(draft, editId);
    if (conflicto) {
      errEl.innerHTML = `<i class="ti ti-alert-circle"></i><span>${MSG_MEDICO_CONFLICTO(conflicto)}</span>`;
      errEl.classList.remove('hidden');
      return;
    }

    if (!isPersonalMedico(nombre, esMedico)) {
      infoEl.innerHTML = `<i class="ti ti-info-circle"></i><span>${MSG_ORGANIZATIVO}</span>`;
      infoEl.classList.remove('hidden');
    }
  }

  function onFormChange() {
    syncMedicoCheckboxFromName();
    updateFormAlerts();
  }

  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  }

  function initials(name) {
    const p = name.trim().split(/\s+/);
    return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
  }

  function fmt(dateStr) {
    if (!dateStr) return '—';
    const [, m, d] = dateStr.split('-');
    return d + '/' + m;
  }

  function estadoBadge(e) {
    const map = {
      confirmado: ['badge-ok', 'Confirmado'],
      pendiente: ['badge-pend', 'Pendiente'],
      completado: ['badge-done', 'Completado'],
    };
    const [cls, label] = map[e] || ['badge-pend', e];
    return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
  }

  function renderStats() {
    const agentes = [...new Set(data.map(d => d.nombre))].length;
    const confirmados = data.filter(d => d.estado === 'confirmado').length;
    const pendientes = data.filter(d => d.estado === 'pendiente').length;
    const conSegundo = [...new Set(data.filter(d => d.tramo === 2).map(d => d.nombre))].length;
    const cards = [
      { icon: 'ti-users', label: 'Agentes', val: agentes },
      { icon: 'ti-calendar-check', label: 'Tramos confirmados', val: confirmados },
      { icon: 'ti-clock-pause', label: 'Pendientes', val: pendientes },
      { icon: 'ti-layers-union', label: 'Con 2.° tramo', val: conSegundo },
    ];
    document.getElementById('licStats').innerHTML = cards.map(c => `
      <div class="stat-card accent">
        <i class="ti ${c.icon} stat-icon"></i>
        <div class="stat-label">${c.label}</div>
        <div class="stat-value">${c.val}</div>
      </div>`).join('');
  }

  function renderTable() {
    const q = document.getElementById('licSearch').value.toLowerCase();
    const ft = document.getElementById('licFilterTramo').value;
    const fe = document.getElementById('licFilterEstado').value;
    let rows = data.filter(d => {
      if (q && !d.nombre.toLowerCase().includes(q)) return false;
      if (ft && String(d.tramo) !== ft) return false;
      if (fe && d.estado !== fe) return false;
      return true;
    });
    rows.sort((a, b) => a.nombre.localeCompare(b, 'es') || a.tramo - b.tramo);
    const tbody = document.getElementById('licTbody');
    const nodata = document.getElementById('licNodata');
    if (!rows.length) {
      tbody.innerHTML = '';
      nodata.style.display = 'block';
      return;
    }
    nodata.style.display = 'none';
    const editHidden = editEnabled ? '' : ' hidden';
    tbody.innerHTML = rows.map(r => {
      const av = avatarColor(r.nombre);
      const ini = initials(r.nombre);
      const daysTaken = r.tomados ? `<span class="days-num">${r.tomados}</span>` : `<span class="days-num days-zero">—</span>`;
      const daysLeft = r.restan ? `<span class="days-num">${r.restan}</span>` : `<span class="days-num days-zero">—</span>`;
      return `
      <tr>
        <td class="col-agent">
          <div class="agent-cell">
            <div class="avatar" style="background:${av.bg};color:${av.text}">${ini}</div>
            <span class="agent-name">${r.nombre}</span>
          </div>
        </td>
        <td><span class="tramo-pill tramo-${r.tramo}">Tramo ${r.tramo}</span></td>
        <td><span class="date-text">${fmt(r.desde)}</span></td>
        <td><span class="date-text">${fmt(r.hasta)}</span></td>
        <td style="text-align:center">${daysTaken}</td>
        <td style="text-align:center">${daysLeft}</td>
        <td>${estadoBadge(r.estado)}</td>
        <td class="col-act">
          <button class="edit-btn${editHidden}" onclick="LicenciasModule.openEdit(${r.id})" aria-label="Editar">
            <i class="ti ti-edit"></i>
          </button>
        </td>
      </tr>`;
    }).join('');
  }

  function calcDias() {
    const d = document.getElementById('licDesde').value;
    const h = document.getElementById('licHasta').value;
    const hint = document.getElementById('licDiasHint');
    const tomadosEl = document.getElementById('licTomados');

    if (!d || !h) {
      if (hint) {
        hint.innerHTML = '<i class="ti ti-calendar-stats"></i> Los días tomados se calculan en días hábiles: no se incluyen sábados, domingos ni feriados nacionales.';
      }
      return;
    }

    const habiles = typeof LicenciasDias !== 'undefined'
      ? LicenciasDias.contarDiasLicencia(d, h)
      : 0;
    const calendario = typeof LicenciasDias !== 'undefined'
      ? LicenciasDias.diasCalendario(d, h)
      : 0;

    if (parseIsoLocal(h) < parseIsoLocal(d)) {
      if (tomadosEl) tomadosEl.value = '';
      if (hint) hint.innerHTML = '<i class="ti ti-alert-circle"></i> La fecha «hasta» debe ser posterior o igual a «desde».';
      return;
    }

    if (tomadosEl) tomadosEl.value = habiles;

    if (hint) {
      const excluidos = calendario - habiles;
      const msg = excluidos > 0
        ? `${habiles} día${habiles === 1 ? '' : 's'} hábil${habiles === 1 ? '' : 'es'} (${excluidos} fin de semana o feriado${excluidos === 1 ? '' : 's'} no contabilizado${excluidos === 1 ? '' : 's'}).`
        : `${habiles} día${habiles === 1 ? '' : 's'} hábil${habiles === 1 ? '' : 'es'}.`;
      hint.innerHTML = `<i class="ti ti-calendar-stats"></i> ${msg}`;
    }
  }

  function parseIsoLocal(iso) {
    const [y, m, day] = iso.split('-').map(Number);
    return new Date(y, m - 1, day);
  }

  function openAdd() {
    document.getElementById('licEditId').value = '';
    document.getElementById('licModalTitle').textContent = 'Agregar tramo de licencia';
    ['licNombre', 'licDesde', 'licHasta', 'licTomados', 'licRestan', 'licNotas'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('licTramo').value = '1';
    document.getElementById('licEstado').value = 'confirmado';
    document.getElementById('licEsMedico').checked = false;
    document.getElementById('licModal').classList.add('open');
    updateFormAlerts();
    document.getElementById('licNombre').focus();
  }

  function openEdit(id) {
    const r = data.find(d => d.id === id);
    if (!r) return;
    document.getElementById('licEditId').value = id;
    document.getElementById('licModalTitle').textContent = 'Editar tramo de licencia';
    document.getElementById('licNombre').value = r.nombre;
    document.getElementById('licTramo').value = r.tramo;
    document.getElementById('licDesde').value = r.desde || '';
    document.getElementById('licHasta').value = r.hasta || '';
    document.getElementById('licTomados').value = r.tomados || '';
    document.getElementById('licRestan').value = r.restan != null ? r.restan : '';
    document.getElementById('licEstado').value = r.estado;
    document.getElementById('licNotas').value = r.notas || '';
    document.getElementById('licEsMedico').checked = isPersonalMedico(r.nombre, r.esMedico);
    document.getElementById('licModal').classList.add('open');
    calcDias();
    updateFormAlerts();
  }

  function closeModal() {
    document.getElementById('licModal').classList.remove('open');
  }

  function saveEntry() {
    saveEntryAsync();
  }

  async function saveEntryAsync() {
    const nombre = document.getElementById('licNombre').value.trim();
    if (!nombre) { alert('Ingresá el nombre del agente.'); return; }

    const esMedico = document.getElementById('licEsMedico').checked;
    const desde = document.getElementById('licDesde').value;
    const hasta = document.getElementById('licHasta').value;
    let tomados = parseInt(document.getElementById('licTomados').value) || 0;
    if (desde && hasta && typeof LicenciasDias !== 'undefined') {
      tomados = LicenciasDias.contarDiasLicencia(desde, hasta);
    }

    const entry = {
      nombre,
      esMedico,
      tramo: parseInt(document.getElementById('licTramo').value),
      desde,
      hasta,
      tomados,
      restan: parseInt(document.getElementById('licRestan').value) || 0,
      estado: document.getElementById('licEstado').value,
      notas: document.getElementById('licNotas').value.trim(),
    };

    const editIdRaw = document.getElementById('licEditId').value;
    const editId = editIdRaw ? parseInt(editIdRaw) : null;

    const conflicto = findMedicoConflict(entry, editId);
    if (conflicto) {
      const errEl = document.getElementById('licErrorBanner');
      if (errEl) {
        errEl.innerHTML = `<i class="ti ti-alert-circle"></i><span>${MSG_MEDICO_CONFLICTO(conflicto)}</span>`;
        errEl.classList.remove('hidden');
      }
      if (typeof showToast === 'function') showToast(MSG_MEDICO_CONFLICTO(conflicto), 'error', 9000);
      return;
    }

    try {
      if (useSupabase && typeof DataService !== 'undefined') {
        const existing = editId ? data.find(d => d.id === editId) : null;
        const saved = await DataService.saveLicencia({
          id: editId,
          agenteId: existing?.agenteId,
          ...entry,
        });
        if (editId) {
          const idx = data.findIndex(d => d.id === editId);
          if (idx > -1) data[idx] = saved;
        } else {
          data.push(saved);
          nextId = Math.max(nextId, saved.id + 1);
        }
      } else if (editId) {
        const idx = data.findIndex(d => d.id === editId);
        if (idx > -1) data[idx] = { id: editId, ...entry };
      } else {
        const newId = nextId++;
        data.push({ id: newId, ...entry });
      }

      if (editId && typeof logAudit === 'function') {
        logAudit({
          modulo: 'Licencias',
          tabla: 'licencias',
          accion: 'UPDATE',
          registroId: String(editId),
          detalle: `Se modificó la licencia de ${nombre}`,
        });
      } else if (!editId && typeof logAudit === 'function') {
        logAudit({
          modulo: 'Licencias',
          tabla: 'licencias',
          accion: 'INSERT',
          registroId: String(data[data.length - 1]?.id || ''),
          detalle: `Se registró una nueva licencia para ${nombre}`,
        });
      }

      saveLicenciasLocal();
    } catch (err) {
      if (typeof showToast === 'function') {
        showToast('No se pudo guardar en la base de datos: ' + (err.message || err), 'error', 7000);
      }
      return;
    }

    if (entry.esMedico && !personalMedico.some(m => normalizeName(m) === normalizeName(entry.nombre))) {
      personalMedico.push(entry.nombre);
      localStorage.setItem(PERSONAL_MEDICO_KEY, JSON.stringify(personalMedico));
    }

    closeModal();
    renderStats();
    renderTable();

    if (!isPersonalMedico(entry.nombre, entry.esMedico)) {
      if (typeof showToast === 'function') showToast(MSG_ORGANIZATIVO, 'info', 9000);
    } else if (typeof showToast === 'function') {
      showToast(useSupabase ? 'Licencia guardada en la base de datos.' : 'Licencia registrada correctamente.', 'success');
    }
  }

  function getFilteredData() {
    const q = (document.getElementById('licSearch')?.value || '').toLowerCase();
    const ft = document.getElementById('licFilterTramo')?.value || '';
    const fe = document.getElementById('licFilterEstado')?.value || '';
    return data.filter(d => {
      if (q && !d.nombre.toLowerCase().includes(q)) return false;
      if (ft && String(d.tramo) !== ft) return false;
      if (fe && d.estado !== fe) return false;
      return true;
    }).sort((a, b) => a.nombre.localeCompare(b, 'es') || a.tramo - b.tramo);
  }

  function getExportRows() {
    const headers = ['Agente', 'Tramo', 'Desde', 'Hasta', 'Días tomados', 'Días restantes', 'Estado', 'Notas'];
    const rows = getFilteredData().map(r => [r.nombre, r.tramo, r.desde, r.hasta, r.tomados, r.restan, r.estado, r.notas]);
    return { headers, rows };
  }

  function exportCSV() {
    ExportPrint.exportCsv('licencias');
  }

  function setEditMode(_enabled) {
    editEnabled = true;
    if (initialized) renderTable();
  }

  function init() {
    if (!initialized) {
      document.getElementById('licSearch').addEventListener('input', renderTable);
      document.getElementById('licFilterTramo').addEventListener('change', renderTable);
      document.getElementById('licFilterEstado').addEventListener('change', renderTable);
      document.getElementById('licModal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
      });
      initialized = true;
    }
    initAsync();
  }

  async function initAsync() {
    loading = true;
    renderTable();
    try {
      await refreshFromSupabase();
      personalMedico = loadPersonalMedico();
    } catch (err) {
      console.warn('[Licencias] Supabase:', err);
      const loaded = loadLicenciasLocal();
      data = loaded.data;
      nextId = loaded.nextId;
      useSupabase = false;
    }
    loading = false;
    renderStats();
    renderTable();
    setEditMode(typeof canEdit === 'function' ? canEdit() : true);
  }

  return { init, openAdd, openEdit, closeModal, saveEntry, exportCSV, getExportRows, calcDias, setEditMode, onFormChange };
})();
