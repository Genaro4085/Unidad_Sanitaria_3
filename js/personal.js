/* ── Padrón de personal sanitario (solo administrador) ── */

const PersonalModule = (() => {
  const OVERRIDES_KEY = 'us3_personal_overrides';
  let rows = [];
  let source = '';
  let initialized = false;
  let editEnabled = false;
  let useSupabase = false;

  const COLS = [
    { key: 'apellidoNombre', label: 'Apellido y nombre' },
    { key: 'legajo', label: 'N° Leg' },
    { key: 'dni', label: 'DNI' },
    { key: 'fechaNacimiento', label: 'F. nacimiento' },
    { key: 'jerarquia', label: 'Jerarquía' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'emailOficial', label: 'Mail oficial' },
    { key: 'emailPersonal', label: 'Mail personal' },
    { key: 'funcion', label: 'Función' },
    { key: 'jornada', label: 'Jornada' },
    { key: 'matricula', label: 'Matrícula' },
    { key: 'gdeba', label: 'Gdeba' },
  ];

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rowKey(r) {
    return String(r.legajo || r.id);
  }

  function loadOverrides() {
    try {
      return JSON.parse(localStorage.getItem(OVERRIDES_KEY)) || {};
    } catch (_) {
      return {};
    }
  }

  function saveOverride(legajo, data) {
    const all = loadOverrides();
    all[String(legajo)] = data;
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
    if (typeof PlatformSync !== 'undefined') PlatformSync.schedulePush();
  }

  function applyOverrides(list) {
    const all = loadOverrides();
    return list.map(r => {
      const o = all[rowKey(r)];
      if (!o) return r;
      const merged = { ...r, ...o };
      if (merged.apellido || merged.nombre) {
        merged.apellidoNombre = typeof DataService !== 'undefined'
          ? DataService.displayAgentName(merged.apellido, merged.nombre)
          : `${merged.apellido} ${merged.nombre}`.trim();
      }
      return merged;
    });
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return iso;
  }

  function fmtCell(key, row) {
    if (key === 'fechaNacimiento') return fmtDate(row[key]);
    if (key === 'telefono' && row[key]) {
      const tel = String(row[key]).replace(/\s/g, '');
      return `<a href="tel:${esc(tel)}" class="contact-chip contact-chip--phone" title="${esc(row[key])}">
        <i class="ti ti-phone"></i><span>${esc(row[key])}</span></a>`;
    }
    if (key === 'emailOficial' && row[key]) {
      return `<a href="mailto:${esc(row[key])}" class="contact-chip contact-chip--mail" title="${esc(row[key])}">
        <i class="ti ti-mail"></i><span>${esc(row[key])}</span></a>`;
    }
    if (key === 'emailPersonal' && row[key]) {
      return `<a href="mailto:${esc(row[key])}" class="contact-chip contact-chip--mail contact-chip--muted" title="${esc(row[key])}">
        <i class="ti ti-mail"></i><span>${esc(row[key])}</span></a>`;
    }
    if (key === 'apellidoNombre') {
      return `<span class="personal-name">${esc(row[key])}</span>`;
    }
    if (key === 'legajo' || key === 'dni' || key === 'gdeba') {
      const val = row[key];
      return val ? `<span class="personal-mono">${esc(val)}</span>` : '<span class="text-muted">—</span>';
    }
    const val = row[key];
    return val ? `<span class="personal-text">${esc(val)}</span>` : '<span class="text-muted">—</span>';
  }

  function plainCell(key, row) {
    if (key === 'fechaNacimiento') return esc(fmtDate(row[key]));
    const val = row[key];
    return val ? esc(String(val)) : '—';
  }

  function renderTablePlain(list) {
    const tbody = document.getElementById('personalTbody');
    if (!tbody) return;
    tbody.innerHTML = list.map(r => `
      <tr>
        ${COLS.map(c => `<td class="personal-col personal-col--${c.key}">${plainCell(c.key, r)}</td>`).join('')}
      </tr>`).join('');
  }

  let printSnapshot = null;

  function preparePrint() {
    const tbody = document.getElementById('personalTbody');
    if (!tbody || !rows.length) return false;
    printSnapshot = {
      search: document.getElementById('personalSearch')?.value || '',
      tbody: tbody.innerHTML,
      count: document.getElementById('personalCount')?.textContent || '',
    };
    renderTablePlain(rows);
    const countEl = document.getElementById('personalCount');
    if (countEl) countEl.textContent = `${rows.length} agentes (padrón completo)`;
    const meta = document.getElementById('personalPrintMeta');
    if (meta) {
      meta.textContent = `Padrón completo — ${rows.length} agentes — Impreso ${new Date().toLocaleString('es-AR')}`;
      meta.classList.remove('hidden');
    }
    const pageStyle = document.createElement('style');
    pageStyle.id = 'personal-print-page';
    pageStyle.textContent = '@media print { @page { size: A4 landscape; margin: 0.7cm; } }';
    document.head.appendChild(pageStyle);
    document.body.classList.add('is-printing-personal');
    return true;
  }

  function restoreAfterPrint() {
    document.body.classList.remove('is-printing-personal');
    document.getElementById('personal-print-page')?.remove();
    const meta = document.getElementById('personalPrintMeta');
    if (meta) {
      meta.textContent = '';
      meta.classList.add('hidden');
    }
    if (!printSnapshot) return;
    const tbody = document.getElementById('personalTbody');
    if (tbody) tbody.innerHTML = printSnapshot.tbody;
    const search = document.getElementById('personalSearch');
    if (search) search.value = printSnapshot.search;
    const countEl = document.getElementById('personalCount');
    if (countEl) countEl.textContent = printSnapshot.count;
    printSnapshot = null;
  }

  function getFiltered() {
    const q = (document.getElementById('personalSearch')?.value || '').trim().toLowerCase();
    if (!q) return rows.slice();
    return rows.filter(r =>
      COLS.some(c => String(r[c.key] ?? '').toLowerCase().includes(q))
    );
  }

  function renderStats(list) {
    const el = document.getElementById('personalStats');
    if (!el) return;
    const medicos = list.filter(r => r.esMedico).length;
    const origen = useSupabase ? 'Supabase' : (source === 'json' ? 'JSON + local' : '—');
    const cards = [
      { icon: 'ti-users', label: 'Total personal', val: list.length },
      { icon: 'ti-stethoscope', label: 'Personal médico', val: medicos },
      { icon: 'ti-database', label: 'Origen', val: origen },
    ];
    el.innerHTML = cards.map(c => `
      <div class="stat-card accent">
        <i class="ti ${c.icon} stat-icon"></i>
        <div class="stat-label">${c.label}</div>
        <div class="stat-value${c.label === 'Origen' ? ' stat-value--sm' : ''}">${esc(c.val)}</div>
      </div>`).join('');
  }

  function renderTable() {
    const list = getFiltered();
    const tbody = document.getElementById('personalTbody');
    const nodata = document.getElementById('personalNodata');
    const countEl = document.getElementById('personalCount');
    if (!tbody) return;

    if (countEl) countEl.textContent = `${list.length} de ${rows.length} agentes`;

    if (!list.length) {
      tbody.innerHTML = '';
      if (nodata) nodata.style.display = rows.length ? 'block' : 'none';
      return;
    }
    if (nodata) nodata.style.display = 'none';

    const editHidden = editEnabled ? '' : ' hidden';
    tbody.innerHTML = list.map(r => `
      <tr>
        ${COLS.map(c => `<td class="personal-col personal-col--${c.key}">${fmtCell(c.key, r)}</td>`).join('')}
        <td class="col-act">
          <button type="button" class="edit-btn${editHidden}" onclick="PersonalModule.openEdit('${esc(rowKey(r))}')" aria-label="Editar agente">
            <i class="ti ti-edit"></i>
          </button>
        </td>
      </tr>`).join('');
  }

  async function loadData() {
    const loadingEl = document.getElementById('personalLoading');
    if (loadingEl) loadingEl.classList.remove('hidden');
    try {
      useSupabase = typeof DataService !== 'undefined' && await DataService.isOnline();
      const result = await DataService.listPersonal();
      rows = applyOverrides(result.data || []);
      source = result.source || '';
    } catch (err) {
      rows = [];
      source = '';
      useSupabase = false;
      if (typeof showToast === 'function') {
        showToast('Error al cargar personal: ' + (err.message || err), 'error', 7000);
      }
    }
    if (loadingEl) loadingEl.classList.add('hidden');
    renderStats(rows);
    renderTable();
  }

  function openEdit(legajoKey) {
    if (!editEnabled) return;
    const r = rows.find(x => rowKey(x) === String(legajoKey));
    if (!r) return;

    document.getElementById('perEditLegajoKey').value = rowKey(r);
    document.getElementById('perSupabaseId').value = r.supabaseId || '';
    document.getElementById('perApellido').value = r.apellido || '';
    document.getElementById('perNombre').value = r.nombre || '';
    document.getElementById('perLegajo').value = r.legajo || '';
    document.getElementById('perDni').value = r.dni || '';
    document.getElementById('perFecha').value = r.fechaNacimiento || '';
    document.getElementById('perJerarquia').value = r.jerarquia || '';
    document.getElementById('perTelefono').value = r.telefono || '';
    document.getElementById('perEmailOficial').value = r.emailOficial || '';
    document.getElementById('perEmailPersonal').value = r.emailPersonal || '';
    document.getElementById('perFuncion').value = r.funcion || '';
    document.getElementById('perJornada').value = r.jornada || '';
    document.getElementById('perMatricula').value = r.matricula || '';
    document.getElementById('perGdeba').value = r.gdeba || '';
    document.getElementById('perEsMedico').checked = !!r.esMedico;

    document.getElementById('perModalTitle').textContent = `Editar — ${r.apellidoNombre}`;
    document.getElementById('perModal').classList.add('open');
  }

  function closeModal() {
    document.getElementById('perModal')?.classList.remove('open');
  }

  function readForm() {
    return {
      supabaseId: document.getElementById('perSupabaseId').value
        ? parseInt(document.getElementById('perSupabaseId').value, 10)
        : null,
      apellido: document.getElementById('perApellido').value.trim(),
      nombre: document.getElementById('perNombre').value.trim(),
      legajo: document.getElementById('perLegajo').value.trim(),
      dni: document.getElementById('perDni').value.trim(),
      fechaNacimiento: document.getElementById('perFecha').value,
      jerarquia: document.getElementById('perJerarquia').value.trim(),
      telefono: document.getElementById('perTelefono').value.trim(),
      emailOficial: document.getElementById('perEmailOficial').value.trim(),
      emailPersonal: document.getElementById('perEmailPersonal').value.trim(),
      funcion: document.getElementById('perFuncion').value.trim(),
      jornada: document.getElementById('perJornada').value.trim(),
      matricula: document.getElementById('perMatricula').value.trim(),
      gdeba: document.getElementById('perGdeba').value.trim(),
      esMedico: document.getElementById('perEsMedico').checked,
    };
  }

  async function saveEntry() {
    if (!editEnabled) return;
    const legajoKey = document.getElementById('perEditLegajoKey').value;
    const entry = readForm();

    if (!entry.apellido || !entry.legajo) {
      if (typeof showToast === 'function') showToast('Apellido y legajo son obligatorios', 'error');
      return;
    }

    try {
      let saved;
      if (useSupabase && typeof DataService !== 'undefined') {
        saved = await DataService.saveAgente(entry);
        const all = loadOverrides();
        delete all[legajoKey];
        if (entry.legajo !== legajoKey) delete all[entry.legajo];
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
      } else {
        saved = {
          ...entry,
          supabaseId: entry.supabaseId,
          id: entry.legajo,
          apellidoNombre: typeof DataService !== 'undefined'
            ? DataService.displayAgentName(entry.apellido, entry.nombre)
            : `${entry.apellido} ${entry.nombre}`.trim(),
        };
        saveOverride(legajoKey, saved);
        if (entry.legajo !== legajoKey) {
          const all = loadOverrides();
          delete all[legajoKey];
          localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
          saveOverride(entry.legajo, saved);
        }
      }

      const idx = rows.findIndex(x => rowKey(x) === legajoKey);
      if (idx > -1) rows[idx] = saved;
      else rows.push(saved);

      if (typeof logAudit === 'function') {
        logAudit({
          modulo: 'Personal',
          tabla: 'agentes',
          accion: 'UPDATE',
          registroId: String(entry.legajo),
          detalle: `Se actualizó el padrón de ${saved.apellidoNombre}`,
        });
      }

      closeModal();
      renderStats(rows);
      renderTable();
      if (typeof showToast === 'function') {
        showToast(useSupabase ? 'Agente actualizado en la base de datos' : 'Cambios guardados localmente', 'success');
      }
    } catch (err) {
      if (typeof showToast === 'function') {
        showToast('No se pudo guardar: ' + (err.message || err), 'error', 7000);
      }
    }
  }

  function getExportRows() {
    const headers = COLS.map(c => c.label);
    const data = rows.map(r => COLS.map(c => {
      if (c.key === 'fechaNacimiento') return fmtDate(r[c.key]).replace('—', '');
      return r[c.key] ?? '';
    }));
    return { headers, rows: data };
  }

  function setEditMode(enabled) {
    editEnabled = !!enabled;
    if (initialized) renderTable();
    const hint = document.getElementById('personalEditHint');
    if (hint) hint.classList.toggle('hidden', !editEnabled);
  }

  function init() {
    if (!initialized) {
      document.getElementById('personalSearch')?.addEventListener('input', renderTable);
      document.getElementById('perModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
      });
      initialized = true;
    }
    setEditMode(typeof isAdminUser === 'function' && isAdminUser());
    loadData();
  }

  return { init, openEdit, closeModal, saveEntry, getExportRows, setEditMode, preparePrint, restoreAfterPrint };
})();
