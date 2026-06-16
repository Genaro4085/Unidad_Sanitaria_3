/* Sincronización US3 ↔ Supabase (respaldo en nube + espejo turnos/laboratorios) */
const PlatformSync = (() => {
  const STATE_ID = 'us3';
  const META_KEY = 'us3_sync_meta';
  const PLATFORM_KEY = 'us3_platform_data_v2';
  const LICENCIAS_KEY = 'us3_licencias_v3';
  const AUDIT_KEY = 'us3_audit_log';
  const OVERRIDES_KEY = 'us3_personal_overrides';
  const MEDICO_KEY = 'us3_personal_medico';
  const PUSH_DEBOUNCE_MS = 1800;

  let pushTimer = null;
  let pushing = false;

  function getMeta() {
    try {
      return JSON.parse(localStorage.getItem(META_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function setMeta(partial) {
    localStorage.setItem(META_KEY, JSON.stringify({ ...getMeta(), ...partial }));
  }

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeJson(key, value) {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  }

  function hasLocalData() {
    const platform = readJson(PLATFORM_KEY);
    const lic = readJson(LICENCIAS_KEY);
    const audit = readJson(AUDIT_KEY);
    if (platform && JSON.stringify(platform).length > 120) return true;
    if (lic?.data?.length) return true;
    if (Array.isArray(audit) && audit.length) return true;
    return false;
  }

  function collectPayload() {
    const platform = typeof appData !== 'undefined'
      ? structuredClone(appData)
      : readJson(PLATFORM_KEY);

    return {
      version: 1,
      platform,
      licencias: readJson(LICENCIAS_KEY),
      audit: readJson(AUDIT_KEY),
      personalOverrides: readJson(OVERRIDES_KEY),
      personalMedico: readJson(MEDICO_KEY),
    };
  }

  function applyPayload(payload) {
    if (!payload || typeof payload !== 'object') return;

    if (payload.platform) writeJson(PLATFORM_KEY, payload.platform);
    if (payload.licencias) writeJson(LICENCIAS_KEY, payload.licencias);
    if (payload.audit) writeJson(AUDIT_KEY, payload.audit);
    if (payload.personalOverrides) writeJson(OVERRIDES_KEY, payload.personalOverrides);
    if (payload.personalMedico) writeJson(MEDICO_KEY, payload.personalMedico);
  }

  function reloadAppState() {
    if (typeof reloadAppDataFromStorage === 'function') {
      reloadAppDataFromStorage();
    }
  }

  function refreshAllViews() {
    if (typeof updateAuthUI === 'function') updateAuthUI();
    if (typeof AdminModule !== 'undefined') AdminModule.refresh();
    if (typeof LicenciasModule !== 'undefined') LicenciasModule.init();
    if (typeof LaboratoriosModule !== 'undefined') LaboratoriosModule.init();
    if (typeof DashboardModule !== 'undefined' && typeof currentView !== 'undefined' && currentView === 'dashboard') {
      DashboardModule.render();
    }
    if (typeof PersonalModule !== 'undefined' && typeof currentView !== 'undefined' && currentView === 'personal') {
      PersonalModule.init();
    }
    if (typeof AuditModule !== 'undefined' && typeof currentView !== 'undefined' && currentView === 'auditoria') {
      AuditModule.init();
    }
  }

  async function pushNow() {
    if (typeof DataService === 'undefined') return false;
    if (!(await DataService.isOnline())) return false;
    if (pushing) return false;

    pushing = true;
    try {
      const payload = collectPayload();
      const saved = await DataService.savePlatformState(payload);
      await DataService.mirrorOperationalTables(payload.platform);
      const ts = saved?.updated_at || new Date().toISOString();
      setMeta({ updatedAt: ts, source: 'local', lastPush: ts });
      updateSyncIndicator('synced', ts);
      return true;
    } catch (err) {
      console.warn('[US3 Sync] push:', err.message || err);
      updateSyncIndicator('error');
      return false;
    } finally {
      pushing = false;
    }
  }

  function schedulePush() {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { pushNow(); }, PUSH_DEBOUNCE_MS);
    updateSyncIndicator('pending');
  }

  async function syncOnStartup() {
    if (typeof DataService === 'undefined') return { ok: false, reason: 'offline' };
    if (!(await DataService.isOnline())) {
      updateSyncIndicator('offline');
      return { ok: false, reason: 'offline' };
    }

    try {
      const remote = await DataService.loadPlatformState();
      const localMeta = getMeta();
      const localTs = Date.parse(localMeta.updatedAt || 0) || 0;
      const remoteTs = Date.parse(remote?.updated_at || 0) || 0;
      const localHas = hasLocalData();
      const remoteHas = remote?.payload && Object.keys(remote.payload).length > 0;

      if (remoteHas && (!localHas || remoteTs >= localTs)) {
        applyPayload(remote.payload);
        reloadAppState();
        setMeta({ updatedAt: remote.updated_at, source: 'cloud', lastPull: remote.updated_at });
        updateSyncIndicator('synced', remote.updated_at);
        if (typeof showToast === 'function') showToast('Datos restaurados desde la nube', 'success');
        return { ok: true, source: 'cloud' };
      }

      if (localHas) {
        await pushNow();
        return { ok: true, source: 'local' };
      }

      updateSyncIndicator('synced');
      return { ok: true, source: 'empty' };
    } catch (err) {
      console.warn('[US3 Sync] startup:', err.message || err);
      updateSyncIndicator('error');
      if (err.code === 'PGRST205' || String(err.message || '').includes('us3_platform_state')) {
        if (typeof showToast === 'function') {
          showToast('Ejecutá supabase/platform_state.sql en Supabase para activar la sincronización', 'error', 9000);
        }
      }
      return { ok: false, reason: err.message };
    }
  }

  function updateSyncIndicator(state, ts) {
    const el = document.getElementById('syncStatusPill');
    if (!el) return;

    const labels = {
      synced: 'Nube OK',
      pending: 'Guardando…',
      offline: 'Solo local',
      error: 'Sync error',
    };

    el.dataset.state = state;
    el.title = ts
      ? `Última sincronización: ${new Date(ts).toLocaleString('es-AR')}`
      : (labels[state] || '');
    el.innerHTML = `<i class="ti ti-${state === 'synced' ? 'cloud-check' : state === 'offline' ? 'cloud-off' : state === 'error' ? 'cloud-x' : 'cloud-upload'}"></i> ${labels[state] || ''}`;
    el.classList.toggle('meta-pill--ok', state === 'synced');
  }

  return {
    syncOnStartup,
    schedulePush,
    pushNow,
    updateSyncIndicator,
    refreshAllViews,
  };
})();
