/* ── Módulo de Auditoría (automático, inmutable) ── */

const AUDIT_STORAGE_KEY = 'us3_audit_log';
const AUDIT_MAX_ENTRIES = 500;

const AUDIT_PAT_LABELS = {
  asmaticos: 'asmáticos',
  diabeticos: 'diabéticos',
  psicofarmacos: 'psicofármacos',
  hiv: 'HIV',
  tbcFase1: 'TBC Fase 1',
  tbcFase2: 'TBC Fase 2',
  hipertensos: 'hipertensos',
  celiacos: 'celíacos',
  discapacitados: 'discapacitados',
  colostomizados: 'colostomizados',
  vacunados: 'vacunados',
  tiroides: 'tiroides',
};

function isAdmin() {
  return sessionStorage.getItem('us3_auth_session') === 'true';
}

function getAuditUser() {
  return sessionStorage.getItem('us3_auth_user') || 'Sistema';
}

function formatAuditUser(raw) {
  const u = String(raw || '').trim();
  if (!u) return 'Sistema';
  if (u.toLowerCase() === 'admin') return 'Administrador';
  return u.charAt(0).toUpperCase() + u.slice(1);
}

function loadAuditLog() {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) { /* ignore */ }
  return [];
}

function persistAuditLog(entries) {
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(entries.slice(0, AUDIT_MAX_ENTRIES)));
  if (typeof PlatformSync !== 'undefined') PlatformSync.schedulePush();
}

/** Registra una acción (solo cuando hay sesión de edición activa). */
function logAudit({ modulo, tabla, accion, registroId, detalle }) {
  if (typeof canEdit === 'function' && !canEdit()) return;

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    usuario: getAuditUser(),
    modulo: modulo || '—',
    tabla: tabla || '—',
    accion: accion || 'UPDATE',
    registroId: registroId != null ? String(registroId) : '—',
    detalle: detalle || '—',
  };

  const log = loadAuditLog();
  log.unshift(entry);
  persistAuditLog(log);
}

function formatAuditDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const AuditModule = (() => {
  let filterModulo = '';
  let filterAccion = '';
  let filterQ = '';

  function seedDemoIfEmpty() {
    const log = loadAuditLog();
    if (log.length) return;
    const demo = [
      { modulo: 'Patologías', tabla: 'patologias', accion: 'UPDATE', registroId: 'hipertensos', detalle: 'Se modificó la cantidad de hipertensos de 67 a 125', usuario: 'Genaro', offset: 3 },
      { modulo: 'Licencias', tabla: 'licencias', accion: 'INSERT', registroId: 'lic-12', detalle: 'Se registró una nueva licencia', usuario: 'Juan Pérez', offset: 2 },
      { modulo: 'Laboratorios', tabla: 'laboratorios', accion: 'DELETE', registroId: 'lab-3', detalle: 'Se eliminó un registro de laboratorio', usuario: 'Genaro', offset: 1 },
    ];
    const now = Date.now();
    const entries = demo.map((d, i) => ({
      id: `demo-${i}`,
      ts: new Date(now - d.offset * 3600000).toISOString(),
      usuario: d.usuario,
      modulo: d.modulo,
      tabla: d.tabla,
      accion: d.accion,
      registroId: d.registroId,
      detalle: d.detalle,
    }));
    persistAuditLog(entries);
  }

  function filtered() {
    return loadAuditLog().filter(e => {
      if (filterModulo && e.modulo !== filterModulo) return false;
      if (filterAccion && e.accion !== filterAccion) return false;
      if (filterQ) {
        const q = filterQ.toLowerCase();
        const hay = [e.usuario, e.modulo, e.accion, e.detalle, e.registroId].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function accionBadge(accion) {
    const map = {
      INSERT: 'audit-badge--insert',
      UPDATE: 'audit-badge--update',
      DELETE: 'audit-badge--delete',
    };
    const cls = map[accion] || 'audit-badge--update';
    return `<span class="audit-badge ${cls}">${accion}</span>`;
  }

  function render() {
    const tbody = document.getElementById('auditTbody');
    const nodata = document.getElementById('auditNodata');
    if (!tbody) return;

    const rows = filtered();
    tbody.innerHTML = rows.map(e => `
      <tr>
        <td><span class="date-text">${formatAuditDate(e.ts)}</span></td>
        <td>${e.usuario}</td>
        <td>${e.modulo}</td>
        <td>${accionBadge(e.accion)}</td>
        <td>${e.detalle}</td>
      </tr>`).join('');

    if (nodata) nodata.style.display = rows.length ? 'none' : 'flex';
  }

  function bindFilters() {
    const search = document.getElementById('auditSearch');
    const mod = document.getElementById('auditFilterModulo');
    const act = document.getElementById('auditFilterAccion');

    if (search && !search.dataset.bound) {
      search.dataset.bound = '1';
      search.addEventListener('input', () => {
        filterQ = search.value.trim();
        render();
      });
    }
    if (mod && !mod.dataset.bound) {
      mod.dataset.bound = '1';
      mod.addEventListener('change', () => {
        filterModulo = mod.value;
        render();
      });
    }
    if (act && !act.dataset.bound) {
      act.dataset.bound = '1';
      act.addEventListener('change', () => {
        filterAccion = act.value;
        render();
      });
    }
  }

  function init() {
    if (!isAdmin()) return;
    seedDemoIfEmpty();
    bindFilters();
    render();
  }

  function rowsForExport() {
    const headers = ['Fecha', 'Usuario', 'Módulo', 'Acción', 'Detalle'];
    const rows = filtered().map(e => [
      formatAuditDate(e.ts),
      e.usuario,
      e.modulo,
      e.accion,
      e.detalle,
    ]);
    return { headers, rows };
  }

  return { init, render, rowsForExport, loadAuditLog };
})();
