/* ── US3 Platform — Core App ── */

const STORAGE_KEY = 'us3_platform_data_v2';
const AUTH_KEY = 'us3_auth_session';
const AUTH_USER_KEY = 'us3_auth_user';
const PORTAL_AUTH_KEY = 'us3_portal_auth';
const PORTAL_USER_KEY = 'us3_portal_user';
const PATOLOGIAS_EDITORS_KEY = 'us3_patologias_editors';
const THEME_KEY = 'us3_theme';

/* Acceso al panel — credencial genérica (futuro: usuario por agente) */
const PORTAL_USER = 'us3';
const PORTAL_PASS = 'us3';

const DEFAULT_DATA = {
  patologias: {
    asmaticos: 1,
    diabeticos: 1,
    psicofarmacos: 1,
    hiv: 1,
    tbcFase1: 1,
    tbcFase2: 1,
    hipertensos: 1,
    celiacos: 1,
    discapacitados: 1,
    colostomizados: 1,
    vacunados: 1,
    tiroides: 1
  },
  poblacion: 974,
  patologiasGrupos: {
    controlAltaComplejidad: {
      label: 'Control diario alta complejidad',
      critical: true,
      internos: ['Interno demo']
    },
    internados: {
      label: 'Internados',
      internos: ['Interno demo']
    },
    huelgaHambre: {
      label: 'Huelga de hambre',
      internos: ['Interno demo']
    }
  },
  trimestral: typeof TrimestralModel !== 'undefined'
    ? TrimestralModel.createDefaultTrimestral()
    : {},
  turnosUrgentes: [
    { id: 1, paciente: 'Interno demo', patologia: 'Demo', especialista: 'Demo', prequirurgico: '', anestesista: '', cardiologia: '', imagenes: '', urgencia: 'media', estado: 'pendiente', notas: 'Dato ficticio' }
  ],
  laboratorios: [
    { id: 1, interno: 'Interno demo', estudio: 'Estudio demo', solicitud: '', medicoSolicitante: 'Demo', estado: 'pendiente' }
  ],
  nextTurnoId: 2,
  nextLabId: 2
};

let appData = loadData();
if (!appData.patologiasGrupos) {
  appData.patologiasGrupos = structuredClone(DEFAULT_DATA.patologiasGrupos);
}
syncPatologiaGrupoCounts();
let isAuthenticated = sessionStorage.getItem(AUTH_KEY) === 'true';
if (isAuthenticated && !sessionStorage.getItem(AUTH_USER_KEY)) {
  sessionStorage.setItem(AUTH_USER_KEY, 'Administrador');
}
let currentView = 'dashboard';
let currentQuarter = '2026-Q1';
let currentTrimTab = 'oficios';

const VIEW_TITLES = {
  dashboard: 'Dashboard',
  licencias: 'Licencias',
  patologias: 'Patologías',
  trimestral: 'Trimestrales',
  turnos: 'Turnos',
  laboratorios: 'Laboratorios',
  administracion: 'Administración',
  personal: 'Personal sanitario',
  auditoria: 'Auditoría',
  configuracion: 'Configuración',
};

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const trim = typeof TrimestralModel !== 'undefined'
        ? TrimestralModel.normalizeAll(parsed.trimestral)
        : (parsed.trimestral || DEFAULT_DATA.trimestral);
      return {
        ...DEFAULT_DATA,
        ...parsed,
        patologias: { ...DEFAULT_DATA.patologias, ...parsed.patologias },
        patologiasGrupos: mergePatologiasGrupos(parsed.patologiasGrupos),
        trimestral: trim,
        laboratorios: parsed.laboratorios || DEFAULT_DATA.laboratorios
      };
    }
  } catch (_) { /* ignore */ }
  return structuredClone(DEFAULT_DATA);
}

function mergePatologiasGrupos(saved) {
  const base = structuredClone(DEFAULT_DATA.patologiasGrupos);
  if (!saved || typeof saved !== 'object') return base;
  Object.keys(base).forEach(key => {
    if (saved[key]) {
      base[key] = {
        ...base[key],
        ...saved[key],
        internos: Array.isArray(saved[key].internos) ? saved[key].internos : base[key].internos
      };
    }
  });
  return base;
}

function syncPatologiaGrupoCounts() {
  if (appData.patologias && 'controlAltaComplejidad' in appData.patologias) {
    delete appData.patologias.controlAltaComplejidad;
  }
}

function saveData() {
  syncPatologiaGrupoCounts();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  if (typeof PlatformSync !== 'undefined') {
    PlatformSync.persist(appData);
  }
}

function reloadAppDataFromStorage() {
  appData = loadData();
  syncPatologiaGrupoCounts();
  if (typeof isAuthenticated !== 'undefined' && isAuthenticated && !sessionStorage.getItem(AUTH_USER_KEY)) {
    sessionStorage.setItem(AUTH_USER_KEY, 'Administrador');
  }
}

function canEdit() {
  return isAuthenticated;
}

function isAdminUser() {
  return isAuthenticated;
}

function normalizeEditorId(value) {
  return (value || '').trim().toLowerCase();
}

function getPatologiasEditors() {
  try {
    const saved = localStorage.getItem(PATOLOGIAS_EDITORS_KEY);
    if (saved) return JSON.parse(saved).map(normalizeEditorId).filter(Boolean);
  } catch (_) { /* ignore */ }
  return [];
}

function setPatologiasEditors(list) {
  const unique = [...new Set(list.map(normalizeEditorId).filter(Boolean))];
  localStorage.setItem(PATOLOGIAS_EDITORS_KEY, JSON.stringify(unique));
  if (typeof PlatformSync !== 'undefined') PlatformSync.schedulePush();
}

function grantPatologiasEdit(identifier) {
  const id = normalizeEditorId(identifier);
  if (!id) return false;
  const editors = getPatologiasEditors();
  if (!editors.includes(id)) {
    editors.push(id);
    setPatologiasEditors(editors);
  }
  return true;
}

function revokePatologiasEdit(identifier) {
  const id = normalizeEditorId(identifier);
  setPatologiasEditors(getPatologiasEditors().filter(e => e !== id));
}

function getPortalUserId() {
  return normalizeEditorId(sessionStorage.getItem(PORTAL_USER_KEY) || '');
}

/** Admin o agente con permiso explícito para modificar cantidades de patologías. */
function canEditPatologias() {
  if (isAdminUser()) return true;
  const user = getPortalUserId();
  if (!user) return false;
  return getPatologiasEditors().includes(user);
}

function showToast(message, type = 'info', duration = 3200) {
  const root = document.getElementById('toastRoot');
  if (!root) return;
  const wide = message.length > 80 ? ' toast--wide' : '';
  const t = document.createElement('div');
  t.className = `toast ${type === 'success' ? 'success' : type === 'error' ? 'error' : 'info'}${wide}`;
  t.innerHTML = `<i class="ti ti-${type === 'success' ? 'circle-check' : type === 'error' ? 'alert-circle' : 'info-circle'}"></i> ${message}`;
  root.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

function updateClock() {
  const now = new Date();
  const el = document.getElementById('panelDateTime');
  if (el) {
    const date = now.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
    const time = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    el.innerHTML = `<i class="ti ti-calendar"></i> ${date} · ${time}`;
  }
}

const WEATHER_ICONS = {
  clear: 'ti-sun',
  cloudy: 'ti-cloud',
  fog: 'ti-cloud-fog',
  rain: 'ti-cloud-rain',
  snow: 'ti-snowflake',
  storm: 'ti-cloud-storm',
};

function weatherFromCode(code) {
  if (code === 0) return { icon: WEATHER_ICONS.clear, label: 'Despejado' };
  if (code <= 3) return { icon: WEATHER_ICONS.cloudy, label: 'Parcialmente nublado' };
  if (code <= 48) return { icon: WEATHER_ICONS.fog, label: 'Niebla' };
  if (code <= 67) return { icon: WEATHER_ICONS.rain, label: 'Lluvia' };
  if (code <= 77) return { icon: WEATHER_ICONS.snow, label: 'Nieve' };
  if (code <= 82) return { icon: WEATHER_ICONS.rain, label: 'Chaparrones' };
  return { icon: WEATHER_ICONS.storm, label: 'Tormenta' };
}

async function updateWeather() {
  const el = document.getElementById('panelWeather');
  if (!el) return;

  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=-33.3352&longitude=-60.2562&current=temperature_2m,weather_code&timezone=America%2FArgentina%2FBuenos_Aires';
    const res = await fetch(url);
    if (!res.ok) throw new Error('weather');
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const w = weatherFromCode(data.current.weather_code);
    el.innerHTML = `<i class="ti ${w.icon}"></i> ${temp}°C · ${w.label}`;
    el.title = `Clima en San Nicolás — ${w.label}`;
  } catch (_) {
    el.innerHTML = '<i class="ti ti-cloud"></i> —';
    el.title = 'Clima no disponible';
  }
}

function updatePanelTitle(view) {
  const el = document.getElementById('panelViewTitle');
  if (el) el.textContent = VIEW_TITLES[view] || view;
}

function updateAuthUI() {
  const dot = document.getElementById('authDot');
  const label = document.getElementById('authLabel');
  const loginBtn = document.getElementById('btnLogin');
  const logoutBtn = document.getElementById('btnLogout');

  if (isAuthenticated) {
    if (dot) dot.className = 'auth-dot authed';
    if (label) label.textContent = 'Activa';
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
  } else {
    if (dot) dot.className = 'auth-dot readonly';
    if (label) label.textContent = 'Solo lectura';
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }

  document.querySelectorAll('.admin-only').forEach(el => {
    el.classList.toggle('hidden', !isAdminUser());
  });

  const readOnlyViews = ['patologias', 'trimestral', 'turnos', 'laboratorios'];
  document.querySelectorAll('.readonly-banner').forEach(b => {
    const viewForBanner = {
      readonlyBanner: 'patologias',
      readonlyBanner2: 'trimestral',
      readonlyBanner3: 'turnos',
      readonlyBannerLab: 'laboratorios',
    }[b.id];
    const canEditView = viewForBanner === 'patologias'
      ? canEditPatologias()
      : canEdit();
    if (currentView === 'dashboard' || !readOnlyViews.includes(currentView) || viewForBanner !== currentView || canEditView) {
      b.classList.add('hidden');
    } else {
      b.classList.remove('hidden');
    }
  });

  document.querySelectorAll('.edit-only').forEach(el => {
    el.classList.toggle('hidden', !canEdit());
    if ('disabled' in el) el.disabled = !canEdit();
  });

  document.querySelectorAll('.admin-edit-btn').forEach(el => {
    el.classList.toggle('hidden', !canEdit());
  });

  const urgCount = appData.turnosUrgentes.filter(t => {
    if (t.urgencia !== 'alta') return false;
    if (typeof TurnosModel !== 'undefined') {
      return TurnosModel.resumen(TurnosModel.normalize(t)).estadoGeneral !== 'completado';
    }
    return t.estado !== 'completado';
  }).length;
  const el = document.getElementById('turnoUrgCount');
  if (el) el.textContent = urgCount;

  if (typeof LicenciasModule !== 'undefined') LicenciasModule.setEditMode(canEdit());
  if (typeof PersonalModule !== 'undefined') PersonalModule.setEditMode(isAdminUser());
  if (typeof LaboratoriosModule !== 'undefined') LaboratoriosModule.setEditMode(canEdit());
  if (typeof AdminModule !== 'undefined') AdminModule.refresh();
  if (typeof DashboardModule !== 'undefined' && currentView === 'dashboard') DashboardModule.render();
}

function navigate(view) {
  if ((view === 'auditoria' || view === 'personal') && !isAdminUser()) {
    if (typeof showToast === 'function') showToast('Acceso restringido al administrador', 'error');
    return;
  }

  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const viewEl = document.getElementById('view-' + view);
  if (viewEl) viewEl.classList.add('active');

  document.querySelectorAll(`.nav-item[data-view="${view}"]`).forEach(n => n.classList.add('active'));

  updatePanelTitle(view);
  updateAuthUI();

  if (typeof MotionModule !== 'undefined') MotionModule.onViewChange(view);

  if (view === 'dashboard' && typeof DashboardModule !== 'undefined') DashboardModule.render();
  if (view === 'licencias' && typeof LicenciasModule !== 'undefined') LicenciasModule.init();
  if (view === 'laboratorios' && typeof LaboratoriosModule !== 'undefined') LaboratoriosModule.init();
  if (['patologias', 'trimestral'].includes(view) && typeof AdminModule !== 'undefined') AdminModule.show(view);
  if (view === 'turnos' && typeof TurnosModule !== 'undefined') TurnosModule.show();
  if (view === 'auditoria' && typeof AuditModule !== 'undefined') AuditModule.init();
  if (view === 'personal' && typeof PersonalModule !== 'undefined') PersonalModule.init();
  if (['administracion', 'personal', 'auditoria', 'configuracion'].includes(view)) syncAdminSubnav(view);
}

function syncAdminSubnav(view) {
  document.querySelectorAll('.admin-subnav__btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

function openLogin() {
  document.getElementById('loginOverlay').classList.add('open');
  document.getElementById('loginUser').focus();
}

function closeLogin() {
  document.getElementById('loginOverlay').classList.remove('open');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').style.display = 'none';
}

function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  if (user === 'admin' && pass === 'us3admin') {
    isAuthenticated = true;
    sessionStorage.setItem(AUTH_KEY, 'true');
    sessionStorage.setItem(AUTH_USER_KEY, typeof formatAuditUser === 'function' ? formatAuditUser(user) : 'Administrador');
    closeLogin();
    updateAuthUI();
    showToast('Sesión iniciada correctamente', 'success');
  } else {
    document.getElementById('loginError').style.display = 'block';
    showToast('Credenciales incorrectas', 'error');
  }
}

function doLogout() {
  isAuthenticated = false;
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
  updateAuthUI();
  if (currentView === 'auditoria') navigate('dashboard');
  showToast('Sesión cerrada', 'info');
}

function doPortalLogout() {
  isAuthenticated = false;
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(PORTAL_AUTH_KEY);
  sessionStorage.removeItem(PORTAL_USER_KEY);
  window.location.href = 'index.html';
}

function updateSiteTopHeight() {
  const top = document.getElementById('siteTop');
  if (!top) return;
  const h = top.offsetHeight;
  document.documentElement.style.setProperty('--site-top-h', h + 'px');
}

function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

function setTheme(theme) {
  if (theme !== 'light' && theme !== 'dark') theme = 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  updateThemeUI();
}

function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  if (typeof showToast === 'function') {
    showToast(getTheme() === 'dark' ? 'Tema oscuro activado' : 'Tema claro activado', 'info');
  }
}

function updateThemeUI() {
  const theme = getTheme();
  document.querySelectorAll('[data-theme-btn]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeBtn === theme);
  });
  const icon = document.getElementById('themeToggleIcon');
  if (icon) icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.title = theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  updateSiteTopHeight();
  window.addEventListener('resize', updateSiteTopHeight);
  const top = document.getElementById('siteTop');
  if (top && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(updateSiteTopHeight).observe(top);
  }

  if (sessionStorage.getItem(PORTAL_AUTH_KEY) === 'true' && !sessionStorage.getItem(PORTAL_USER_KEY)) {
    sessionStorage.setItem(PORTAL_USER_KEY, PORTAL_USER);
  }

  updateThemeUI();
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.querySelectorAll('[data-theme-btn]').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.themeBtn));
  });
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  document.querySelectorAll('.admin-subnav__btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  document.querySelectorAll('.quick-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  const bindLogin = id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', openLogin);
  };
  bindLogin('btnLogin');
  bindLogin('btnLoginAdmin');

  document.getElementById('btnLogout')?.addEventListener('click', doLogout);
  document.getElementById('btnPortalLogout')?.addEventListener('click', doPortalLogout);
  document.getElementById('btnTurnoAdd')?.addEventListener('click', () => {
    if (typeof TurnosModule !== 'undefined') TurnosModule.openAdd();
  });
  document.getElementById('btnLabAdd')?.addEventListener('click', () => {
    if (typeof LaboratoriosModule !== 'undefined') LaboratoriosModule.openAdd();
  });
  document.getElementById('loginForm')?.addEventListener('submit', e => { e.preventDefault(); doLogin(); });
  document.getElementById('loginOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLogin();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLogin();
  });

  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  if (toggle && sidebar) {
    const stored = localStorage.getItem('us3_sidebar_collapsed') === '1';
    if (stored) sidebar.classList.add('collapsed');
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('us3_sidebar_collapsed', sidebar.classList.contains('collapsed') ? '1' : '0');
    });
  }

  updateClock();
  setInterval(updateClock, 1000);
  updateWeather();
  setInterval(updateWeather, 30 * 60 * 1000);

  const startView = new URLSearchParams(location.search).get('view');

  if (typeof SupabaseClient !== 'undefined') {
    try {
      const status = await SupabaseClient.ping();
      if (!status.ok) console.warn('[US3 Supabase]', status.error || status.message);
      else if (!status.schemaReady) console.info('[US3 Supabase]', status.message);
      else console.info('[US3 Supabase] Conectado — esquema listo');

      if (status.ok && typeof PlatformSync !== 'undefined') {
        await PlatformSync.bootstrapFromSupabase();
        reloadAppDataFromStorage();
      }
    } catch (err) {
      console.warn('[US3 Supabase]', err.message || err);
    }
  }

  navigate(startView && VIEW_TITLES[startView] ? startView : 'dashboard');
});
