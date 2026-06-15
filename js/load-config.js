/** Carga US3_CONFIG: js/config.js (build/local) o /api/config (respaldo). */
(function () {
  function hasConfig() {
    const c = window.US3_CONFIG;
    return c && c.supabaseUrl && c.supabaseKey && !String(c.supabaseUrl).includes('TU_PROYECTO');
  }

  function loadSync(url) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
        (0, eval)(xhr.responseText);
        return hasConfig();
      }
    } catch (_) { /* ignore */ }
    return false;
  }

  if (hasConfig()) return;

  if (loadSync('js/config.js')) return;
  if (loadSync('/api/config')) return;

  window.US3_CONFIG = window.US3_CONFIG || {};
  console.warn('[US3] Sin configuración Supabase. Verificá SUPABASE_URL y SUPABASE_ANON_KEY en Vercel.');
})();
