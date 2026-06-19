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



  const QUARTERS = TrimestralModel.QUARTERS;

  const TRIMESTRAL_FIELDS = TrimestralModel.TRIMESTRAL_FIELDS;



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

      const editable = typeof canEditPatologias === 'function' ? canEditPatologias() : false;

      const list = internos.length

        ? `<ul class="pathology-fold__list">${internos.map((n, i) => `

          <li>

            <span class="pathology-fold__name">${escapeHtml(n)}</span>

            ${editable ? `<button type="button" class="pathology-fold__remove" onclick="AdminModule.removeInternoGrupo('${key}', ${i})" aria-label="Quitar ${escapeHtml(n)}"><i class="ti ti-x"></i></button>` : ''}

          </li>`).join('')}</ul>`

        : '<p class="pathology-fold__empty">Sin internos registrados.</p>';



      const addBlock = editable ? `

        <div class="pathology-fold__add no-print">

          <input type="text" id="grupo-interno-${key}" placeholder="Apellido y nombre o N° interno" maxlength="120"

            onkeydown="if(event.key==='Enter'){event.preventDefault();AdminModule.addInternoGrupo('${key}');}" />

          <button type="button" class="btn btn-secondary pathology-fold__add-btn" onclick="AdminModule.addInternoGrupo('${key}')">

            <i class="ti ti-plus"></i> Agregar

          </button>

        </div>` : '';



      return `

      <details class="pathology-fold${critical ? ' pathology-fold--critical' : ''}">

        <summary class="pathology-fold__head">

          <span class="pathology-fold__title">${escapeHtml(grupo.label || key)}</span>

          <span class="pathology-fold__count" id="grupo-count-${key}">${count}</span>

        </summary>

        <div class="pathology-fold__body">${list}${addBlock}</div>

      </details>`;

    }).join('');

    bindPriorityGrupoSync();
  }



  function ensureGrupo(key) {

    if (!appData.patologiasGrupos) appData.patologiasGrupos = {};

    if (!appData.patologiasGrupos[key]) {

      const def = DEFAULT_DATA.patologiasGrupos?.[key] || { label: key, internos: [] };

      appData.patologiasGrupos[key] = structuredClone(def);

    }

    if (!Array.isArray(appData.patologiasGrupos[key].internos)) {

      appData.patologiasGrupos[key].internos = [];

    }

  }



  function addInternoGrupo(key) {

    if (typeof canEditPatologias === 'function' ? !canEditPatologias() : !canEdit()) return;

    const input = document.getElementById('grupo-interno-' + key);

    const nombre = input?.value.trim();

    if (!nombre) {

      input?.focus();

      return;

    }

    ensureGrupo(key);

    const internos = appData.patologiasGrupos[key].internos;

    const norm = nombre.toLowerCase();

    if (internos.some(n => String(n).trim().toLowerCase() === norm)) {

      if (typeof showToast === 'function') showToast('Ese interno ya está en la lista.', 'info');

      return;

    }

    internos.push(nombre);

    saveData();

    if (typeof logAudit === 'function') {

      logAudit({

        modulo: 'Patologías',

        tabla: 'patologias_grupos',

        accion: 'INSERT',

        registroId: key,

        detalle: `Se agregó "${nombre}" a ${getGrupo(key).label || key}`,

      });

    }

    renderPriorityGrupos();

    document.querySelectorAll('.pathology-fold').forEach(f => { f.open = true; });

    if (typeof DashboardModule !== 'undefined') DashboardModule.render();

    if (typeof showToast === 'function') showToast('Interno agregado.', 'success');

  }



  function removeInternoGrupo(key, index) {

    if (typeof canEditPatologias === 'function' ? !canEditPatologias() : !canEdit()) return;

    ensureGrupo(key);

    const internos = appData.patologiasGrupos[key].internos;

    const removed = internos[index];

    if (removed == null) return;

    internos.splice(index, 1);

    saveData();

    if (typeof logAudit === 'function') {

      logAudit({

        modulo: 'Patologías',

        tabla: 'patologias_grupos',

        accion: 'DELETE',

        registroId: key,

        detalle: `Se quitó "${removed}" de ${getGrupo(key).label || key}`,

      });

    }

    renderPriorityGrupos();

    document.querySelectorAll('.pathology-fold').forEach(f => { f.open = true; });

    if (typeof DashboardModule !== 'undefined') DashboardModule.render();

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



  function renderPoblacion() {
    const el = document.getElementById('pathologyPoblacion');
    if (!el) return;
    const val = appData.poblacion ?? 974;
    const editable = typeof canEditPatologias === 'function' ? canEditPatologias() : false;
    el.innerHTML = editable
      ? `<div class="pathology-poblacion pathology-poblacion--edit">
          <span class="pathology-poblacion__label">POBLACIÓN:</span>
          <input type="number" min="0" class="pathology-poblacion__input" value="${val}"
            onchange="AdminModule.updatePoblacion(this.value)" aria-label="Población" />
        </div>`
      : `<div class="pathology-poblacion">
          <span class="pathology-poblacion__label">POBLACIÓN:</span>
          <strong class="pathology-poblacion__value">${val}</strong>
        </div>`;
  }

  function updatePoblacion(value) {
    if (typeof canEditPatologias === 'function' ? !canEditPatologias() : !canEdit()) return;
    const oldVal = appData.poblacion ?? 974;
    const newVal = Math.max(0, parseInt(value, 10) || 0);
    if (oldVal === newVal) return;
    appData.poblacion = newVal;
    saveData();
    if (typeof logAudit === 'function') {
      logAudit({
        modulo: 'Patologías',
        tabla: 'patologias',
        accion: 'UPDATE',
        registroId: 'poblacion',
        detalle: `Se modificó la población de ${oldVal} a ${newVal}`,
      });
    }
    renderPoblacion();
    if (typeof showToast === 'function') showToast('Población actualizada', 'success');
  }

  function renderPatologias() {

    renderPoblacion();

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



  function ensureTrimestralQuarter() {
    appData.trimestral = TrimestralModel.normalizeAll(appData.trimestral);
    return appData.trimestral[currentQuarter];
  }

  function trimestralItemHtml(f, quarterData, months, editable) {
    if (TrimestralModel.isScalarField(f.key)) {
      const val = TrimestralModel.normalizeScalar(quarterData[f.key]);
      const input = editable
        ? `<input type="number" min="0" value="${val}"
            onchange="AdminModule.updateTrimestralScalar('${f.key}', this.value)" />`
        : `<div class="trimestral-count">${val}</div>`;
      return `
      <div class="trimestral-item trimestral-item--scalar">
        <label><i class="ti ${f.icon}"></i> ${escapeHtml(f.label)}</label>
        <div class="trimestral-scalar-body">${input}</div>
        <div class="trim-item-foot">
          <span>Total</span>
          <strong id="trim-total-${f.key}">${val}</strong>
        </div>
      </div>`;
    }

    const data = quarterData[f.key] || TrimestralModel.emptyMonths();
    const total = TrimestralModel.fieldTotal(data, f.key);
    const monthInputs = [0, 1, 2].map(i => {
      const val = data[`m${i}`] ?? 0;
      const short = escapeHtml(months[i].slice(0, 3));
      const cell = editable
        ? `<input type="number" min="0" class="trim-item-min" value="${val}" aria-label="${escapeHtml(months[i])}"
            onchange="AdminModule.updateTrimestralMonth('${f.key}', ${i}, this.value)" />`
        : `<span class="trim-item-val">${val}</span>`;
      return `<div class="trim-item-cell"><span class="trim-item-mname">${short}</span>${cell}</div>`;
    }).join('');

    return `
    <div class="trimestral-item trimestral-item--months">
      <label><i class="ti ${f.icon}"></i> ${escapeHtml(f.label)}</label>
      <div class="trim-item-months">${monthInputs}</div>
      <div class="trim-item-foot">
        <span>Total</span>
        <strong id="trim-total-${f.key}">${total}</strong>
      </div>
    </div>`;
  }

  function renderTrimestral() {
    ensureTrimestralQuarter();

    const selector = document.getElementById('quarterSelector');
    selector.innerHTML = QUARTERS.map(q => `
      <button class="quarter-btn${currentQuarter === q.key ? ' active' : ''}"
        onclick="AdminModule.selectQuarter('${q.key}')">${q.label}</button>
    `).join('');

    const quarterData = appData.trimestral[currentQuarter];
    const months = TrimestralModel.monthLabels(currentQuarter);
    const editable = typeof canEditTrimestral === 'function' ? canEditTrimestral() : false;
    const grid = document.getElementById('trimestralGrid');

    grid.innerHTML = TRIMESTRAL_FIELDS
      .map(f => trimestralItemHtml(f, quarterData, months, editable))
      .join('');

    renderTrimestralCompare();
  }

  function prepareTrimestralPrint() {
    const grid = document.getElementById('trimestralGrid');
    if (!grid) return null;
    const restored = [];
    grid.querySelectorAll('input[type="number"]').forEach(input => {
      const span = document.createElement('span');
      span.className = input.classList.contains('trim-item-min') ? 'trim-item-val' : 'trimestral-count';
      span.textContent = input.value || '0';
      const parent = input.parentNode;
      parent.replaceChild(span, input);
      restored.push({ parent, input, span });
    });
    return restored.length ? restored : null;
  }

  function restoreTrimestralPrint(restored) {
    if (!restored?.length) return;
    restored.forEach(({ parent, input, span }) => {
      if (span.parentNode === parent) parent.replaceChild(input, span);
    });
  }

  function renderTrimestralCompare() {
    const chartEl = document.getElementById('trimestralChart');
    if (!chartEl) return;

    const compareFields = TRIMESTRAL_FIELDS;
    const quarters = QUARTERS;

    const quarterCharts = quarters.map((q, qi) => {
      const totals = TrimestralModel.quarterTotals(appData.trimestral[q.key] || {});
      const values = compareFields.map(f => totals[f.key] ?? 0);
      const quarterMax = Math.max(...values, 1);

      const total = values.reduce((a, b) => a + b, 0);

      const bars = compareFields.map((f, fi) => {
        const v = values[fi];
        const hPct = Math.max(4, Math.round((v / quarterMax) * 100));
        return `
          <div class="trim-q-bar-item" title="${escapeHtml(f.label)}: ${v}">
            <div class="trim-q-bar-track">
              <span class="trim-q-bar-tip">${v}</span>
              <div class="bar-fill bar-fill--q${qi + 1}" style="height:${hPct}%"></div>
            </div>
            <span class="trim-q-bar-icon"><i class="ti ${f.icon}"></i></span>
          </div>`;
      }).join('');

      return `
        <div class="trim-compare-quarter trim-compare-quarter--q${qi + 1}">
          <div class="trim-compare-quarter__head">
            <span class="trim-compare-badge">${escapeHtml(q.short)}</span>
            <span class="trim-compare-total" title="Total del trimestre">${total}</span>
          </div>
          <div class="bar-chart trim-q-bar-chart">${bars}</div>
        </div>`;
    }).join('');

    const legend = compareFields.map(f => `
      <span class="trim-compare-legend-item" title="${escapeHtml(f.label)}">
        <i class="ti ${f.icon}"></i> ${escapeHtml(f.label)}
      </span>`).join('');

    chartEl.innerHTML = `
      <div class="trim-compare-wrap">
        <div class="trim-compare-heading">
          <i class="ti ti-chart-dots"></i>
          <div>
            <strong>Comparativa trimestral</strong>
            <span>Totales por indicador en cada trimestre</span>
          </div>
        </div>
        <div class="trim-compare-quarters">${quarterCharts}</div>
        <div class="trim-compare-legend">${legend}</div>
      </div>`;
  }

  function selectQuarter(key) {
    currentQuarter = key;
    renderTrimestral();
  }

  function updateTrimestralMonth(field, monthIdx, value) {
    if (!canEditTrimestral()) return;
    ensureTrimestralQuarter();
    const mk = `m${monthIdx}`;
    const oldVal = appData.trimestral[currentQuarter][field][mk] ?? 0;
    const newVal = Math.max(0, parseInt(value, 10) || 0);
    if (oldVal === newVal) return;

    appData.trimestral[currentQuarter][field][mk] = newVal;
    saveData();

    const totalEl = document.getElementById('trim-total-' + field);
    if (totalEl) {
      totalEl.textContent = TrimestralModel.fieldTotal(appData.trimestral[currentQuarter][field], field);
    }
    renderTrimestralCompare();

    const fieldDef = TRIMESTRAL_FIELDS.find(f => f.key === field);
    const months = TrimestralModel.monthLabels(currentQuarter);
    const label = fieldDef ? fieldDef.label : field;
    if (typeof logAudit === 'function') {
      logAudit({
        modulo: 'Trimestrales',
        tabla: 'trimestral',
        accion: 'UPDATE',
        registroId: `${currentQuarter}/${field}/${mk}`,
        detalle: `Se modificó ${label} — ${months[monthIdx]} (${currentQuarter}) de ${oldVal} a ${newVal}`,
      });
    }
  }

  function updateTrimestralScalar(field, value) {
    if (!canEditTrimestral()) return;
    ensureTrimestralQuarter();
    const oldVal = TrimestralModel.normalizeScalar(appData.trimestral[currentQuarter][field]);
    const newVal = Math.max(0, parseInt(value, 10) || 0);
    if (oldVal === newVal) return;

    appData.trimestral[currentQuarter][field] = newVal;
    saveData();

    const totalEl = document.getElementById('trim-total-' + field);
    if (totalEl) totalEl.textContent = newVal;

    renderTrimestralCompare();

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



  function show(view) {

    if (view === 'patologias') renderPatologias();

    if (view === 'trimestral') renderTrimestral();

    if (view === 'turnos' && typeof TurnosModule !== 'undefined') TurnosModule.show();

  }



  function refresh() {

    if (currentView === 'turnos' && typeof TurnosModule !== 'undefined') TurnosModule.refresh();

    else show(currentView);

  }



  return {

    renderPatologias, updatePatologia, updatePoblacion, addInternoGrupo, removeInternoGrupo, renderTrimestral, selectQuarter,

    updateTrimestralMonth, updateTrimestralScalar, prepareTrimestralPrint, restoreTrimestralPrint,

    renderTurnos: () => typeof TurnosModule !== 'undefined' && TurnosModule.render(),

    openTurnoAdd: () => typeof TurnosModule !== 'undefined' && TurnosModule.openAdd(),

    openTurnoEdit: (id) => typeof TurnosModule !== 'undefined' && TurnosModule.openEdit(id),

    closeTurnoModal: () => typeof TurnosModule !== 'undefined' && TurnosModule.closeModal(),

    saveTurno: () => typeof TurnosModule !== 'undefined' && TurnosModule.saveTurno(),

    deleteTurno: () => typeof TurnosModule !== 'undefined' && TurnosModule.deleteTurno(),

    show, refresh

  };

})();


