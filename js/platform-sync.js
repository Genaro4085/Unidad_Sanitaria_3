/* Persistencia 100% Supabase — localStorage solo caché offline */
const PlatformSync = (() => {
  const PLATFORM_KEY = 'us3_platform_data_v2';
  const LICENCIAS_KEY = 'us3_licencias_v3';
  const AUDIT_KEY = 'us3_audit_log';
  const OVERRIDES_KEY = 'us3_personal_overrides';
  const MEDICO_KEY = 'us3_personal_medico';
  const EDITORS_KEY = 'us3_patologias_editors';
  const META_KEY = 'us3_sync_meta';
  const PUSH_DEBOUNCE_MS = 800;

  let pushTimer = null;
  let pushing = false;
  let supabaseReady = false;

  function getMeta() {
    try { return JSON.parse(localStorage.getItem(META_KEY) || '{}') || {}; }
    catch { return {}; }
  }

  function setMeta(partial) {
    localStorage.setItem(META_KEY, JSON.stringify({ ...getMeta(), ...partial }));
  }

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function writeJson(key, value) {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  }

  function cacheLocally(payload) {
    if (!payload) return;
    if (payload.platform) writeJson(PLATFORM_KEY, payload.platform);
    if (payload.licencias) writeJson(LICENCIAS_KEY, payload.licencias);
    if (payload.audit) writeJson(AUDIT_KEY, payload.audit);
    if (payload.personalOverrides) writeJson(OVERRIDES_KEY, payload.personalOverrides);
    if (payload.personalMedico) writeJson(MEDICO_KEY, payload.personalMedico);
    if (payload.patologiasEditors) writeJson(EDITORS_KEY, payload.patologiasEditors);
  }

  function collectPayload() {
    return {
      version: 2,
      platform: typeof appData !== 'undefined' ? structuredClone(appData) : readJson(PLATFORM_KEY),
      licencias: readJson(LICENCIAS_KEY),
      audit: readJson(AUDIT_KEY),
      personalOverrides: readJson(OVERRIDES_KEY),
      personalMedico: readJson(MEDICO_KEY),
      patologiasEditors: readJson(EDITORS_KEY),
    };
  }

  function isSupabaseReady() {
    return supabaseReady;
  }

  async function pushNow() {
    if (typeof DataService === 'undefined') return false;
    if (!(await DataService.isOnline())) {
      updateSyncIndicator('offline');
      return false;
    }
    if (pushing) return false;

    pushing = true;
    try {
      const payload = collectPayload();
      cacheLocally(payload);
      const saved = await DataService.saveFullPlatform(payload);
      const ts = saved?.updated_at || new Date().toISOString();
      setMeta({ updatedAt: ts, source: 'supabase' });
      updateSyncIndicator('synced', ts);
      return true;
    } catch (err) {
      console.warn('[US3 Supabase]', err.message || err);
      updateSyncIndicator('error');
      if (typeof showToast === 'function') {
        showToast('No se pudo guardar en Supabase: ' + (err.message || err), 'error', 7000);
      }
      return false;
    } finally {
      pushing = false;
    }
  }

  function schedulePush() {
    if (!supabaseReady) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { pushNow(); }, PUSH_DEBOUNCE_MS);
    updateSyncIndicator('pending');
  }

  function persist(appDataSnapshot) {
    if (appDataSnapshot) writeJson(PLATFORM_KEY, appDataSnapshot);
    if (!supabaseReady) {
      updateSyncIndicator('offline');
      return;
    }
    schedulePush();
  }

  async function bootstrapFromSupabase() {
    if (typeof DataService === 'undefined') {
      updateSyncIndicator('offline');
      return { ok: false, reason: 'no-dataservice' };
    }

    if (!(await DataService.isOnline())) {
      supabaseReady = false;
      updateSyncIndicator('offline');
      if (typeof showToast === 'function') {
        showToast('Sin conexión a Supabase — solo lectura desde caché local', 'error', 6000);
      }
      return { ok: false, reason: 'offline' };
    }

    supabaseReady = true;

    try {
      let payload = await DataService.loadFullPlatform();

      if (!payload?.platform) {
        const localPlatform = readJson(PLATFORM_KEY);
        const localHas = localPlatform && JSON.stringify(localPlatform).length > 120;
        if (localHas) {
          payload = collectPayload();
          await DataService.saveFullPlatform(payload);
          if (typeof showToast === 'function') showToast('Datos locales migrados a Supabase', 'success');
        }
      }

      if (payload) {
        cacheLocally(payload);
        if (typeof reloadAppDataFromStorage === 'function') reloadAppDataFromStorage();
        if (payload.audit && typeof replaceAuditLog === 'function') {
          replaceAuditLog(payload.audit);
        }
      }

      const remote = await DataService.loadPlatformState();
      const ts = remote?.updated_at || new Date().toISOString();
      setMeta({ updatedAt: ts, source: 'supabase' });
      updateSyncIndicator('synced', ts);
      return { ok: true, source: 'supabase' };
    } catch (err) {
      supabaseReady = false;
      console.warn('[US3 Supabase] bootstrap:', err.message || err);
      updateSyncIndicator('error');
      if (err.code === 'PGRST205' || String(err.message || '').includes('us3_platform_state')) {
        if (typeof showToast === 'function') {
          showToast('Ejecutá supabase/platform_state.sql en Supabase', 'error', 9000);
        }
      }
      return { ok: false, reason: err.message };
    }
  }

  function updateSyncIndicator(state, ts) {
    const el = document.getElementById('syncStatusPill');
    if (!el) return;

    const labels = {
      synced: 'Supabase OK',
      pending: 'Guardando…',
      offline: 'Sin Supabase',
      error: 'Error Supabase',
    };

    el.dataset.state = state;
    el.title = ts
      ? `Última sync: ${new Date(ts).toLocaleString('es-AR')}`
      : (labels[state] || '');
    el.innerHTML = `<i class="ti ti-${state === 'synced' ? 'cloud-check' : state === 'offline' ? 'cloud-off' : state === 'error' ? 'cloud-x' : 'cloud-upload'}"></i> ${labels[state] || ''}`;
    el.classList.toggle('meta-pill--ok', state === 'synced');
  }

  return {
    bootstrapFromSupabase,
    syncOnStartup: bootstrapFromSupabase,
    schedulePush,
    pushNow,
    persist,
    isSupabaseReady,
    updateSyncIndicator,
  };
})();
