/** Carga US3_CONFIG: /api/config en Vercel, js/config.js en local. */
(function () {
  function loadSync(url) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
        (0, eval)(xhr.responseText);
        return true;
      }
    } catch (_) { /* ignore */ }
    return false;
  }

  if (!loadSync('/api/config') && !loadSync('js/config.js')) {
    window.US3_CONFIG = {};
    console.warn('[US3] Sin configuración Supabase. En Vercel: SUPABASE_URL y SUPABASE_ANON_KEY.');
  }
})();
