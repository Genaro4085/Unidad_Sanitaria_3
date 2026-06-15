/* ── Administración Module ── */



const AdminModule = (() => {

  const PRIORITY_GRUPOS = [

    { key: 'controlAltaComplejidad', critical: true },

    { key: 'internados' },

    { key: 'huelgaHambre' },

  ];



  const PATOLOGIAS = [

    { key: 'asmaticos', label: 'Asmáticos', icon: 'ti-lungs' },

    { key: 'diabeticos', label: 'Diabéticos', icon: 'ti-droplet' },

    { key: 'psicofarmacos', label: 'Psicofármacos', icon: 'ti-pill' },

    { key: 'hiv', label: 'HIV', icon: 'ti-virus' },

    { key: 'tbcFase1', label: 'TBC — Fase 1', icon: 'ti-lungs' },

    { key: 'tbcFase2', label: 'TBC — Fase 2', icon: 'ti-lungs' },

    { key: 'hipertensos', label: 'Hipertensos', icon: 'ti-heartbeat' },

    { key: 'celiacos', label: 'Celíacos', icon: 'ti-bread' },

    { key: 'discapacitados', label: 'Discapacitados', icon: 'ti-wheelchair' },

    { key: 'colostomizados', label: 'Colostomizados', icon: 'ti-medical-cross' },

    { key: 'vacunados', label: 'Vacunados', icon: 'ti-vaccine' },

    { key: 'tiroides', label: 'Hipotiroidismo / Hipertiroidismo', icon: 'ti-activity' },

  ];



  const QUARTERS = [

    { key: '2026-Q1', label: '1.er Trimestre 2026' },

    { key: '2026-Q2', label: '2.° Trimestre 2026' },

    { key: '2026-Q3', label: '3.er Trimestre 2026' },

    { key: '2026-Q4', label: '4.° Trimestre 2026' },

  ];



  const TRIMESTRAL_FIELDS = [

    { key: 'oficios', label: 'Oficios contestados', icon: 'ti-file-check' },

    { key: 'odontologia', label: 'Atenciones odontológicas', icon: 'ti-dental' },

    { key: 'psiquiatria', label: 'Atenciones psiquiátricas', icon: 'ti-brain' },

    { key: 'psicologia', label: 'Atenciones psicológicas', icon: 'ti-mood-smile' },

    { key: 'consultas', label: 'Consultas médicas', icon: 'ti-stethoscope' },

    { key: 'derivaciones', label: 'Derivaciones hospitalarias', icon: 'ti-building-hospital' },

    { key: 'interconsultas', label: 'Interconsultas', icon: 'ti-arrows-exchange' },

    { key: 'saludMental', label: 'Salud mental (total)', icon: 'ti-heart-handshake' },

  ];



  const ESPECIALISTAS = [

    'Cirugía general', 'Traumatología', 'Urología', 'Oftalmología',

    'Otorrinolaringología', 'Cardiología', 'Gastroenterología', 'Neurología', 'Otro'

  ];



  let turnoEditId = null;



  function escapeHtml(str) {

    return String(str ?? '')

      .replace(/&/g, '&amp;')

      .replace(/</g, '&lt;')

      .replace(/>/g, '&gt;')

      .replace(/"/g, '&quot;');

  }



  function getGrupo(key) {

    return appData.patologiasGrupos?.[key] || { label: key, internos: [] };

  }



  function renderPriorityGrupos() {

    const el = document.getElementById('pathologyPriority');

    if (!el) return;



    el.innerHTML = PRIORITY_GRUPOS.map(({ key, critical }) => {

      const grupo = getGrupo(key);

      const internos = Array.isArray(grupo.internos) ? grupo.internos : [];

      const count = internos.length;

      const list = internos.length

        ? `<ul class="pathology-fold__list">${internos.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`

        : '<p class="pathology-fold__empty">Sin internos registrados.</p>';



      return `

      <details class="pathology-fold${critical ? ' pathology-fold--critical' : ''}">

        <summary class="pathology-fold__head">

          <span class="pathology-fold__title">${escapeHtml(grupo.label || key)}</span>

          <span class="pathology-fold__count" id="grupo-count-${key}">${count}</span>

        </summary>

        <div class="pathology-fold__body">${list}</div>

      </details>`;

    }).join('');

    bindPriorityGrupoSync();
  }



  function bindPriorityGrupoSync() {
    const container = document.getElementById('pathologyPriority');
    if (!container) return;
    const folds = container.querySelectorAll('.pathology-fold');
    let syncing = false;
    folds.forEach(fold => {
      fold.addEventListener('toggle', () => {
        if (syncing) return;
        syncing = true;
        const isOpen = fold.open;
        folds.forEach(f => { f.open = isOpen; });
        syncing = false;
      });
    });
  }



  function renderPatologias() {

    renderPriorityGrupos();



    const grid = document.getElementById('pathologyGrid');

    if (!grid) return;



    const editable = typeof canEditPatologias === 'function' ? canEditPatologias() : false;

    grid.innerHTML = PATOLOGIAS.map(p => {

      const val = appData.patologias[p.key] ?? 0;

      const editBlock = editable
        ? `<div class="pathology-edit visible">
          <input type="number" min="0" value="${val}" data-key="${p.key}"
            onchange="AdminModule.updatePatologia('${p.key}', this.value)" />
        </div>`
        : '';

      return `

      <div class="pathology-card${p.key.startsWith('tbc') ? ' pathology-card--tbc' : ''}">

        <div class="path-icon"><i class="ti ${p.icon}"></i></div>

        <h3>${p.label}</h3>

        <div class="pathology-count" id="count-${p.key}">${val}</div>

        ${editBlock}

      </div>`;

    }).join('');

  }



  function updatePatologia(key, value) {

    if (typeof canEditPatologias === 'function' ? !canEditPatologias() : !canEdit()) return;

    const oldVal = appData.patologias[key] ?? 0;

    const newVal = parseInt(value) || 0;

    if (oldVal === newVal) return;

    appData.patologias[key] = newVal;

    saveData();

    document.getElementById('count-' + key).textContent = newVal;

    const label = (typeof AUDIT_PAT_LABELS !== 'undefined' && AUDIT_PAT_LABELS[key]) || key;

    if (typeof logAudit === 'function') {

      logAudit({

        modulo: 'Patologías',

        tabla: 'patologias',

        accion: 'UPDATE',

        registroId: key,

        detalle: `Se modificó la cantidad de ${label} de ${oldVal} a ${newVal}`,

      });

    }

    if (typeof DashboardModule !== 'undefined') DashboardModule.render();

  }



  function renderTrimestral() {

    const selector = document.getElementById('quarterSelector');

    selector.innerHTML = QUARTERS.map(q => `

      <button class="quarter-btn${currentQuarter === q.key ? ' active' : ''}"

        onclick="AdminModule.selectQuarter('${q.key}')">${q.label}</button>

    `).join('');



    const data = appData.trimestral[currentQuarter] || {};

    const editable = canEdit();

    const grid = document.getElementById('trimestralGrid');

    grid.innerHTML = TRIMESTRAL_FIELDS.map(f => `

      <div class="trimestral-item">

        <label><i class="ti ${f.icon}"></i> ${f.label}</label>

        <input type="number" min="0" value="${data[f.key] ?? 0}"

          ${editable ? '' : 'disabled'}

          onchange="AdminModule.updateTrimestral('${f.key}', this.value)" />

      </div>

    `).join('');

    renderTrimestralCompare();

  }



  function renderTrimestralCompare() {

    const chartEl = document.getElementById('trimestralChart');

    if (!chartEl) return;

    const keys = ['oficios', 'odontologia', 'consultas', 'derivaciones'];

    const labels = ['Oficios', 'Odontología', 'Consultas', 'Derivaciones'];

    const quarters = ['2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4'];

    const series = quarters.map(q => keys.map(k => appData.trimestral[q]?.[k] ?? 0));

    const max = Math.max(...series.flat(), 1);

    const bars = quarters.map((q, qi) => {

      const inner = keys.map((k, ki) => {

        const v = series[qi][ki];

        const h = Math.round((v / max) * 100);

        return `<div class="bar-fill bar-fill--q${qi}" style="height:${h}%" title="${labels[ki]}: ${v}"></div>`;

      }).join('');

      return `<div class="trim-quarter-group"><div class="bar-chart bar-chart--compact">${inner}</div><span>${q.replace('2026-', 'T')}</span></div>`;

    }).join('');

    chartEl.innerHTML = `

      <div class="chart-card" style="grid-column:1/-1">

        <h3>Comparativa trimestral</h3>

        <div class="trim-compare-row">${bars}</div>

        <div class="chart-legend">${labels.map(l => `<span>${l}</span>`).join('')}</div>

      </div>`;

  }



  function selectQuarter(key) {

    currentQuarter = key;

    renderTrimestral();

  }



  function updateTrimestral(field, value) {

    if (!canEdit()) return;

    if (!appData.trimestral[currentQuarter]) appData.trimestral[currentQuarter] = {};

    const oldVal = appData.trimestral[currentQuarter][field] ?? 0;

    const newVal = parseInt(value) || 0;

    if (oldVal === newVal) return;

    appData.trimestral[currentQuarter][field] = newVal;

    saveData();

    const fieldDef = TRIMESTRAL_FIELDS.find(f => f.key === field);

    const label = fieldDef ? fieldDef.label : field;

    if (typeof logAudit === 'function') {

      logAudit({

        modulo: 'Trimestrales',

        tabla: 'trimestral',

        accion: 'UPDATE',

        registroId: `${currentQuarter}/${field}`,

        detalle: `Se modificó ${label} (${currentQuarter}) de ${oldVal} a ${newVal}`,

      });

    }

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



  function estadoTurnoBadge(e) {

    const map = {

      pendiente: ['badge-pend', 'Pendiente'],

      programado: ['badge-done', 'Programado'],

      completado: ['badge-ok', 'Completado'],

    };

    const [cls, label] = map[e] || ['badge-pend', e];

    return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;

  }



  function fmt(dateStr) {

    if (!dateStr) return '—';

    const [, m, d] = dateStr.split('-');

    return d + '/' + m + '/' + dateStr.slice(0, 4);

  }



  function renderTurnos() {

    const q = (document.getElementById('turnoSearch')?.value || '').toLowerCase();

    const fu = document.getElementById('turnoFilterUrg')?.value || '';

    const fe = document.getElementById('turnoFilterEst')?.value || '';



    let rows = appData.turnosUrgentes.filter(t => {

      if (q && !t.paciente.toLowerCase().includes(q) && !t.patologia.toLowerCase().includes(q)) return false;

      if (fu && t.urgencia !== fu) return false;

      if (fe && t.estado !== fe) return false;

      return true;

    });



    rows.sort((a, b) => {

      const urgOrder = { alta: 0, media: 1, baja: 2 };

      return (urgOrder[a.urgencia] ?? 9) - (urgOrder[b.urgencia] ?? 9);

    });



    const tbody = document.getElementById('turnoTbody');

    const nodata = document.getElementById('turnoNodata');

    const editHidden = canEdit() ? '' : ' hidden';



    if (!rows.length) {

      tbody.innerHTML = '';

      nodata.style.display = 'block';

      return;

    }

    nodata.style.display = 'none';



    tbody.innerHTML = rows.map(t => `

      <tr class="urgency-${t.urgencia === 'alta' ? 'high' : t.urgencia === 'media' ? 'med' : 'low'}">

        <td><strong>${t.paciente}</strong><br><span class="date-text">${t.patologia}</span></td>

        <td>${t.especialista}</td>

        <td><span class="date-text">${fmt(t.prequirurgico)}</span></td>

        <td><span class="date-text">${fmt(t.anestesista)}</span></td>

        <td><span class="date-text">${fmt(t.cardiologia)}</span></td>

        <td><span class="date-text">${fmt(t.imagenes)}</span></td>

        <td>${urgenciaBadge(t.urgencia)}</td>

        <td>${estadoTurnoBadge(t.estado)}</td>

        <td class="col-act">

          <button class="edit-btn admin-edit-btn${editHidden}" onclick="AdminModule.openTurnoEdit(${t.id})" aria-label="Editar">

            <i class="ti ti-edit"></i>

          </button>

        </td>

      </tr>

    `).join('');

  }



  function openTurnoAdd() {

    turnoEditId = null;

    document.getElementById('turnoModalTitle').textContent = 'Nuevo turno urgente';

    ['turnoPaciente', 'turnoPatologia', 'turnoPrequir', 'turnoAnest', 'turnoCardio', 'turnoImg', 'turnoNotas'].forEach(id => {

      document.getElementById(id).value = '';

    });

    document.getElementById('turnoEsp').value = ESPECIALISTAS[0];

    document.getElementById('turnoUrg').value = 'alta';

    document.getElementById('turnoEst').value = 'pendiente';

    document.getElementById('turnoModal').classList.add('open');

  }



  function openTurnoEdit(id) {

    const t = appData.turnosUrgentes.find(x => x.id === id);

    if (!t) return;

    turnoEditId = id;

    document.getElementById('turnoModalTitle').textContent = 'Editar turno urgente';

    document.getElementById('turnoPaciente').value = t.paciente;

    document.getElementById('turnoPatologia').value = t.patologia;

    document.getElementById('turnoEsp').value = t.especialista;

    document.getElementById('turnoPrequir').value = t.prequirurgico || '';

    document.getElementById('turnoAnest').value = t.anestesista || '';

    document.getElementById('turnoCardio').value = t.cardiologia || '';

    document.getElementById('turnoImg').value = t.imagenes || '';

    document.getElementById('turnoUrg').value = t.urgencia;

    document.getElementById('turnoEst').value = t.estado;

    document.getElementById('turnoNotas').value = t.notas || '';

    document.getElementById('turnoModal').classList.add('open');

  }



  function closeTurnoModal() {

    document.getElementById('turnoModal').classList.remove('open');

  }



  function saveTurno() {

    const paciente = document.getElementById('turnoPaciente').value.trim();

    if (!paciente) { alert('Ingresá identificación del interno.'); return; }

    const entry = {

      paciente,

      patologia: document.getElementById('turnoPatologia').value.trim(),

      especialista: document.getElementById('turnoEsp').value,

      prequirurgico: document.getElementById('turnoPrequir').value,

      anestesista: document.getElementById('turnoAnest').value,

      cardiologia: document.getElementById('turnoCardio').value,

      imagenes: document.getElementById('turnoImg').value,

      urgencia: document.getElementById('turnoUrg').value,

      estado: document.getElementById('turnoEst').value,

      notas: document.getElementById('turnoNotas').value.trim(),

    };

    if (turnoEditId) {

      const idx = appData.turnosUrgentes.findIndex(t => t.id === turnoEditId);

      if (idx > -1) appData.turnosUrgentes[idx] = { id: turnoEditId, ...entry };

      if (typeof logAudit === 'function') {

        logAudit({

          modulo: 'Turnos',

          tabla: 'turnos_urgentes',

          accion: 'UPDATE',

          registroId: String(turnoEditId),

          detalle: `Se modificó el turno de ${paciente}`,

        });

      }

    } else {

      const newId = appData.nextTurnoId++;

      appData.turnosUrgentes.push({ id: newId, ...entry });

      if (typeof logAudit === 'function') {

        logAudit({

          modulo: 'Turnos',

          tabla: 'turnos_urgentes',

          accion: 'INSERT',

          registroId: String(newId),

          detalle: `Se registró un nuevo turno para ${paciente}`,

        });

      }

    }

    saveData();

    closeTurnoModal();

    renderTurnos();

  }



  function deleteTurno() {

    if (!turnoEditId || !confirm('¿Eliminar este turno?')) return;

    const t = appData.turnosUrgentes.find(x => x.id === turnoEditId);

    appData.turnosUrgentes = appData.turnosUrgentes.filter(t => t.id !== turnoEditId);

    saveData();

    if (typeof logAudit === 'function' && t) {

      logAudit({

        modulo: 'Turnos',

        tabla: 'turnos_urgentes',

        accion: 'DELETE',

        registroId: String(turnoEditId),

        detalle: `Se eliminó el turno de ${t.paciente}`,

      });

    }

    closeTurnoModal();

    renderTurnos();

  }



  function show(view) {

    if (view === 'patologias') renderPatologias();

    if (view === 'trimestral') renderTrimestral();

    if (view === 'turnos') renderTurnos();

  }



  function refresh() {

    show(currentView);

  }



  function initTurnosFilters() {

    ['turnoSearch', 'turnoFilterUrg', 'turnoFilterEst'].forEach(id => {

      const el = document.getElementById(id);

      if (el) el.addEventListener('input', renderTurnos);

      if (el) el.addEventListener('change', renderTurnos);

    });

    document.getElementById('turnoModal')?.addEventListener('click', e => {

      if (e.target === e.currentTarget) closeTurnoModal();

    });

  }



  document.addEventListener('DOMContentLoaded', initTurnosFilters);



  return {

    renderPatologias, updatePatologia, renderTrimestral, selectQuarter,

    updateTrimestral, renderTurnos, openTurnoAdd, openTurnoEdit,

    closeTurnoModal, saveTurno, deleteTurno, show, refresh

  };

})();


