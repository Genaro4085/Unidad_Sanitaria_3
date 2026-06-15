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



  function medico(row) {

    return row.medicoSolicitante || row.medico || '—';

  }



  function formatDate(iso) {

    if (!iso) return '—';

    const [y, m, d] = iso.split('-');

    return `${d}/${m}/${y}`;

  }



  function filtered() {

    return (appData.laboratorios || []).filter(row => {

      const q = filterSearch.toLowerCase();

      const med = medico(row).toLowerCase();

      const matchQ = !q

        || row.interno.toLowerCase().includes(q)

        || row.estudio.toLowerCase().includes(q)

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

    tbody.innerHTML = rows.map(row => `

      <tr>

        <td>${row.interno}</td>

        <td>${row.estudio}</td>

        <td>${formatDate(row.solicitud)}</td>

        <td>${medico(row)}</td>

        <td><span class="badge ${ESTADO_CLASS[row.estado] || ''}">${ESTADO_LABELS[row.estado] || row.estado}</span></td>

      </tr>`).join('');



    if (nodata) nodata.style.display = rows.length ? 'none' : 'flex';

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



  function init() {

    if (!appData.laboratorios) appData.laboratorios = [];

    bindFilters();

    renderTable();

  }



  function rowsForExport() {

    const headers = ['Interno', 'Estudio', 'Solicitud', 'Médico solicitante', 'Estado'];

    const rows = (appData.laboratorios || []).map(r => [

      r.interno,

      r.estudio,

      r.solicitud,

      medico(r) === '—' ? '' : medico(r),

      ESTADO_LABELS[r.estado] || r.estado,

    ]);

    return { headers, rows };

  }



  return { init, rowsForExport };

})();


