/** Valida US3_CONFIG cargado por script (js/config.js o /api/config). Sin XHR síncrono: bloquea con SW. */
(function () {
  function hasConfig() {
    const c = window.US3_CONFIG;
    return c && c.supabaseUrl && c.supabaseKey && !String(c.supabaseUrl).includes('TU_PROYECTO');
  }

  if (hasConfig()) return;

  window.US3_CONFIG = window.US3_CONFIG || {};
  console.warn('[US3] Sin configuración Supabase. Verificá SUPABASE_URL y SUPABASE_ANON_KEY en Vercel.');
})();
