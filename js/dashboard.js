/* ── Dashboard — KPIs y gráficos ── */



const DashboardModule = (() => {

  const KPI_DEFS = [

    { key: '_total', label: 'Internos asistidos', icon: 'ti-users-group', color: '#0276BC', tooltip: 'Total de personas bajo seguimiento sanitario', calc: d => Object.values(d.patologias).reduce((a, b) => a + b, 0), delta: '+3.2%' },

    { key: 'asmaticos', label: 'Asmáticos', icon: 'ti-lungs', color: '#038FC9', delta: '+1' },

    { key: 'diabeticos', label: 'Diabéticos', icon: 'ti-droplet', color: '#0BA8D6', delta: '0' },

    { key: 'hiv', label: 'HIV', icon: 'ti-virus', color: '#313F5F', delta: '0' },
    { key: 'tbcFase1', label: 'TBC — Fase 1', icon: 'ti-lungs', color: '#1E3A8A', delta: '0' },
    { key: 'tbcFase2', label: 'TBC — Fase 2', icon: 'ti-lungs', color: '#2563EB', delta: '0' },
    { key: 'hipertensos', label: 'Hipertensos', icon: 'ti-heartbeat', color: '#1CC5E2', delta: '+4' },

    { key: 'psicofarmacos', label: 'Psicofármacos', icon: 'ti-pill', color: '#0276BC', delta: '+2' },

    { key: 'celiacos', label: 'Celíacos', icon: 'ti-wheat-off', color: '#038FC9', delta: '0' },

    { key: 'discapacitados', label: 'Discapacitados', icon: 'ti-wheelchair', color: '#0BA8D6', delta: '+1' },

    { key: 'colostomizados', label: 'Colostomizados', icon: 'ti-medical-cross', color: '#313F5F', delta: '0' },

    { key: 'vacunados', label: 'Vacunados', icon: 'ti-vaccine', color: '#038FC9', delta: '0' },

    { key: 'tiroides', label: 'Hipotiroidismo / Hipertiroidismo', icon: 'ti-activity', color: '#0BA8D6', delta: '0' },
  ];



  function deltaClass(d) {

    if (!d || d === '0') return '';

    return String(d).startsWith('-') ? 'down' : '';

  }



  function renderSummary() {

    const el = document.getElementById('dashboardSummary');

    if (!el) return;



    const total = Object.values(appData.patologias).reduce((a, b) => a + b, 0);

    const critical = appData.patologiasGrupos?.controlAltaComplejidad?.internos?.length
      ?? appData.patologias.controlAltaComplejidad ?? 0;

    const urgentes = appData.turnosUrgentes.filter(t => t.urgencia === 'alta' && t.estado !== 'completado').length;



    el.innerHTML = `

      <div class="summary-card">

        <span class="summary-card__label">Personas en seguimiento</span>

        <span class="summary-card__value">${total}</span>

      </div>

      <div class="summary-card summary-card--critical">

        <span class="summary-card__label">Alta complejidad (control diario)</span>

        <span class="summary-card__value">${critical}</span>

      </div>

      <div class="summary-card">

        <span class="summary-card__label">Turnos urgentes activos</span>

        <span class="summary-card__value">${urgentes}</span>

      </div>`;

  }



  function renderKpis() {

    const el = document.getElementById('dashboardKpis');

    if (!el) return;

    el.innerHTML = KPI_DEFS.map(k => {

      const val = k.calc ? k.calc(appData) : (appData.patologias[k.key] ?? 0);

      return `

      <div class="kpi-card${k.critical ? ' kpi-card--critical' : ''}" data-tooltip="${k.tooltip || k.label}" title="${k.tooltip || k.label}">

        <div class="kpi-card__icon" style="background:linear-gradient(135deg,${k.color}22,${k.color}44);color:${k.color}">

          <i class="ti ${k.icon}"></i>

        </div>

        <div class="kpi-card__label">${k.critical ? k.label.toUpperCase() : k.label}</div>

        <div class="kpi-card__value">${val}</div>

        ${k.delta && k.delta !== '0' ? `<div class="kpi-card__delta ${deltaClass(k.delta)}">${k.delta}</div>` : ''}

      </div>`;

    }).join('');

  }



  function barChart() {

    const items = Object.entries(appData.patologias)

      .map(([key, val]) => ({ key, val, label: key.charAt(0).toUpperCase() + key.slice(0, 6) }))

      .sort((a, b) => b.val - a.val);

    const max = Math.max(...items.map(i => i.val), 1);

    const bars = items.map(i => {

      const h = Math.max(4, Math.round((i.val / max) * 100));

      return `<div class="bar-chart__item" title="${i.key}: ${i.val}">

        <div class="bar-chart__bar" style="height:${h}px"></div>

        <span class="bar-chart__label">${i.val}</span>

      </div>`;

    }).join('');

    return `<div class="chart-card"><h3>Distribución por patología</h3><div class="bar-chart">${bars}</div></div>`;

  }



  function lineChart() {

    const quarters = ['2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4'];

    const vals = quarters.map(q => {

      const t = appData.trimestral[q] || {};

      return (t.oficios || 0) + (t.odontologia || 0) + (t.consultas || 0) + (t.saludMental || 0);

    });

    const max = Math.max(...vals, 1);

    const pts = vals.map((v, i) => {

      const x = 10 + i * 28;

      const y = 90 - (v / max) * 70;

      return `${x},${y}`;

    }).join(' ');

    return `

    <div class="chart-card">

      <h3>Actividad trimestral (índice)</h3>

      <svg class="line-chart" viewBox="0 0 120 100" preserveAspectRatio="none">

        <polyline fill="none" stroke="url(#lineGrad)" stroke-width="2.5" points="${pts}"/>

        <defs><linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">

          <stop offset="0%" stop-color="#0276BC"/><stop offset="100%" stop-color="#1CC5E2"/>

        </linearGradient></defs>

      </svg>

      <div class="chart-legend">${quarters.map((q, i) => `<span>${q.replace('2026-', 'T')}: ${vals[i]}</span>`).join('')}</div>

    </div>`;

  }



  function donutChart() {

    const vals = Object.values(appData.patologias);

    const total = vals.reduce((a, b) => a + b, 0) || 1;

    const colors = ['#0276BC', '#038FC9', '#0BA8D6', '#1CC5E2', '#313F5F', '#92A1B4', '#9EE6F4', '#0276BC'];

    let offset = 0;

    const segs = vals.map((v, i) => {

      const pct = (v / total) * 100;

      const seg = `<circle class="donut-seg" cx="50" cy="50" r="40" fill="transparent"

        stroke="${colors[i % colors.length]}" stroke-width="12"

        stroke-dasharray="${pct * 2.51} 251"

        stroke-dashoffset="${-offset * 2.51}"

        transform="rotate(-90 50 50)"/>`;

      offset += pct;

      return seg;

    }).join('');

    return `

    <div class="chart-card chart-card--donut">

      <h3>Composición epidemiológica</h3>

      <div class="donut-wrap">

        <svg viewBox="0 0 100 100">${segs}</svg>

        <div class="donut-center"><span class="donut-total">${total}</span><span class="donut-sub">registros</span></div>

      </div>

    </div>`;

  }



  function renderCharts() {

    const el = document.getElementById('dashboardCharts');

    if (!el) return;

    el.innerHTML = barChart() + lineChart() + donutChart();

  }



  function render() {

    renderSummary();

    renderKpis();

    renderCharts();

  }



  return { render };

})();


