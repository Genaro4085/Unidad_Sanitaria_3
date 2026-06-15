/* Cliente Supabase único — requiere @supabase/supabase-js + js/config.js */
const SupabaseClient = (() => {
  let client = null;
  let ready = false;
  let lastError = null;

  function getConfig() {
    return window.US3_CONFIG || {};
  }

  function init() {
    const { supabaseUrl, supabaseKey } = getConfig();
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('TU_PROYECTO')) {
      lastError = 'Configuración Supabase incompleta (variables SUPABASE_URL / SUPABASE_ANON_KEY)';
      return null;
    }
    if (!window.supabase?.createClient) {
      lastError = 'Librería @supabase/supabase-js no cargada';
      return null;
    }
    try {
      client = window.supabase.createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      ready = true;
      lastError = null;
      return client;
    } catch (err) {
      lastError = err.message || 'Error al crear cliente Supabase';
      return null;
    }
  }

  function get() {
    return client || init();
  }

  async function ping() {
    const sb = get();
    if (!sb) return { ok: false, error: lastError };
    try {
      const { error } = await sb.from('agentes').select('id', { count: 'exact', head: true });
      if (error) {
        if (error.code === 'PGRST205') {
          return { ok: true, connected: true, schemaReady: false, message: 'Proyecto conectado; faltan tablas (ejecutá schema.sql)' };
        }
        return { ok: false, error: error.message, code: error.code };
      }
      return { ok: true, connected: true, schemaReady: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Error de red' };
    }
  }

  return {
    get,
    ping,
    isReady: () => ready,
    getError: () => lastError,
  };
})();
