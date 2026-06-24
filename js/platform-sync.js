/* Persistencia Supabase — caché local + sync en vivo entre dispositivos/pestañas */
const PlatformSync = (() => {
  const PLATFORM_KEY = 'us3_platform_data_v2';
  const LICENCIAS_KEY = 'us3_licencias_v3';
  const AUDIT_KEY = 'us3_audit_log';
  const OVERRIDES_KEY = 'us3_personal_overrides';
  const MEDICO_KEY = 'us3_personal_medico';
  const EDITORS_KEY = 'us3_patologias_editors';
  const META_KEY = 'us3_sync_meta';
  const PUSH_DEBOUNCE_MS = 400;
  const POLL_INTERVAL_MS = 12000;

  let pushTimer = null;
  let pushing = false;
  let pushAgain = false;
  let supabaseReady = false;
  let pendingOfflinePush = false;
  let liveSyncStarted = false;
  let pollTimer = null;
  let realtimeChannel = null;
  let pullingRemote = false;
  let lastLocalEditAt = 0;
  let lastPushedAt = 0;
  let deferRemoteUntil = 0;

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

  function hasPendingPush() {
    return !!pushTimer || pushing || pendingOfflinePush;
  }

  function isUserEditing() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function tsValue(value) {
    const n = Date.parse(value || '');
    return Number.isFinite(n) ? n : 0;
  }

  function applyRemotePayload(payload, updatedAt, source) {
    if (!payload) return false;
    cacheLocally(payload);
    if (typeof refreshAllViewsFromData === 'function') {
      refreshAllViewsFromData({ source });
    } else if (typeof reloadAppDataFromStorage === 'function') {
      reloadAppDataFromStorage();
    }
    if (payload.audit && typeof replaceAuditLog === 'function') {
      replaceAuditLog(payload.audit);
    }
    const ts = updatedAt || new Date().toISOString();
    setMeta({ updatedAt: ts, source: 'supabase' });
    updateSyncIndicator('synced', ts);
    return true;
  }

  async function pullRemoteIfNewer(reason) {
    if (typeof DataService === 'undefined' || pullingRemote) return false;
    if (!(await DataService.isOnline())) return false;

    pullingRemote = true;
    try {
      const remote = await DataService.loadPlatformState();
      const remoteTs = remote?.updated_at;
      const knownTs = getMeta().updatedAt;
      if (!remote?.payload || tsValue(remoteTs) <= tsValue(knownTs)) return false;

      if (isUserEditing()) {
        deferRemoteUntil = Date.now() + 5000;
        if (typeof showToast === 'function') {
          showToast('Hay cambios en otro dispositivo. Se actualizará al terminar de editar.', 'info', 4500);
        }
        return false;
      }

      const hasLocalEdits = hasPendingPush() || tsValue(lastLocalEditAt) > tsValue(knownTs);
      if (hasLocalEdits) {
        await flushPending();
        return false;
      }

      const applied = applyRemotePayload(remote.payload, remoteTs, reason || 'remote');
      if (applied && reason !== 'bootstrap' && typeof showToast === 'function') {
        showToast('Datos actualizados desde otro dispositivo', 'info', 3200);
      }
      return applied;
    } catch (err) {
      console.warn('[US3 Supabase] pull:', err.message || err);
      return false;
    } finally {
      pullingRemote = false;
    }
  }

  async function pushNow() {
    if (typeof DataService === 'undefined') return false;
    if (!(await DataService.isOnline())) {
      pendingOfflinePush = true;
      updateSyncIndicator('offline');
      return false;
    }
    if (pushing) {
      pushAgain = true;
      return false;
    }

    if (pushTimer) {
      clearTimeout(pushTimer);
      pushTimer = null;
    }

    pushing = true;
    try {
      const payload = collectPayload();
      cacheLocally(payload);
      const saved = await DataService.saveFullPlatform(payload);
      const ts = saved?.updated_at || new Date().toISOString();
      lastPushedAt = Date.now();
      pendingOfflinePush = false;
      setMeta({ updatedAt: ts, source: 'supabase' });
      updateSyncIndicator('synced', ts);
      return true;
    } catch (err) {
      console.warn('[US3 Supabase]', err.message || err);
      pendingOfflinePush = true;
      updateSyncIndicator('error');
      if (typeof showToast === 'function') {
        showToast('No se pudo guardar en Supabase: ' + (err.message || err), 'error', 7000);
      }
      return false;
    } finally {
      pushing = false;
      if (pushAgain) {
        pushAgain = false;
        setTimeout(() => { pushNow(); }, 0);
      }
    }
  }

  function schedulePush() {
    lastLocalEditAt = Date.now();
    if (!supabaseReady) {
      pendingOfflinePush = true;
      updateSyncIndicator('offline');
      return;
    }
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      pushTimer = null;
      pushNow();
    }, PUSH_DEBOUNCE_MS);
    updateSyncIndicator('pending');
  }

  async function flushPending() {
    if (pushTimer) {
      clearTimeout(pushTimer);
      pushTimer = null;
    }
    if (!hasPendingPush() && !pendingOfflinePush) return true;
    return pushNow();
  }

  function persist(appDataSnapshot) {
    if (appDataSnapshot) writeJson(PLATFORM_KEY, appDataSnapshot);
    if (!supabaseReady) {
      pendingOfflinePush = true;
      updateSyncIndicator('offline');
      return;
    }
    schedulePush();
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(() => {
      if (!supabaseReady || pushing) return;
      if (Date.now() < deferRemoteUntil) return;
      pullRemoteIfNewer('poll');
    }, POLL_INTERVAL_MS);
  }

  function startRealtime() {
    if (realtimeChannel || typeof SupabaseClient === 'undefined') return;
    const sb = SupabaseClient.get();
    if (!sb?.channel) return;

    realtimeChannel = sb
      .channel('us3-platform-state')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'us3_platform_state', filter: 'id=eq.us3' },
        (event) => {
          const remoteTs = event?.new?.updated_at;
          if (!remoteTs) return;
          if (Date.now() - lastPushedAt < 1500 && tsValue(remoteTs) <= tsValue(getMeta().updatedAt) + 1000) {
            return;
          }
          if (pushing) return;
          pullRemoteIfNewer('realtime');
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('[US3 Supabase] Sync en vivo activa');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[US3 Supabase] Realtime no disponible — usando sondeo cada', POLL_INTERVAL_MS / 1000, 's');
        }
      });
  }

  function startLiveSync() {
    if (liveSyncStarted || !supabaseReady) return;
    liveSyncStarted = true;
    startRealtime();
    startPolling();
    bindLifecycleFlush();
  }

  function bindLifecycleFlush() {
    if (bindLifecycleFlush.bound) return;
    bindLifecycleFlush.bound = true;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushPending();
      else if (supabaseReady) pullRemoteIfNewer('visible');
    });

    window.addEventListener('pagehide', () => { flushPending(); });
    window.addEventListener('beforeunload', () => { flushPending(); });

    window.addEventListener('storage', (event) => {
      if (!event.key || event.newValue == null) return;
      if (![PLATFORM_KEY, LICENCIAS_KEY, AUDIT_KEY, META_KEY].includes(event.key)) return;
      if (typeof refreshAllViewsFromData === 'function') {
        refreshAllViewsFromData({ source: 'storage' });
      }
    });

    document.addEventListener('focusin', () => {
      if (Date.now() < deferRemoteUntil && !isUserEditing()) {
        pullRemoteIfNewer('deferred');
      }
    });
  }

  async function onNetworkOnline() {
    if (!(await DataService.isOnline())) return;
    supabaseReady = true;
    if (pendingOfflinePush || hasPendingPush()) {
      await flushPending();
    } else {
      await pullRemoteIfNewer('online');
    }
    startLiveSync();
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
      bindLifecycleFlush();
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
        applyRemotePayload(payload, null, 'bootstrap');
      }

      const remote = await DataService.loadPlatformState();
      const ts = remote?.updated_at || new Date().toISOString();
      setMeta({ updatedAt: ts, source: 'supabase' });
      updateSyncIndicator('synced', ts);
      startLiveSync();
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
      bindLifecycleFlush();
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
    flushPending,
    persist,
    isSupabaseReady,
    onNetworkOnline,
    pullRemoteIfNewer,
    updateSyncIndicator,
  };
})();
