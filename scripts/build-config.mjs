/**
 * Genera js/config.js en el deploy (Vercel) a partir de variables de entorno.
 * Local: usá js/config.js manual o copiá desde js/config.example.js
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_ANON_KEY?.trim();

if (!url || !key) {
  console.warn(
    '[build-config] Faltan SUPABASE_URL y/o SUPABASE_ANON_KEY — omitiendo generación local.\n' +
    '  En Vercel la config se sirve desde /api/config (no hace falta este build).'
  );
  process.exit(0);
}

const content = `/* Generado en build — no editar a mano en producción */
window.US3_CONFIG = {
  supabaseUrl: ${JSON.stringify(url)},
  supabaseKey: ${JSON.stringify(key)},
};
`;

mkdirSync(join(root, 'js'), { recursive: true });
writeFileSync(join(root, 'js', 'config.js'), content, 'utf8');
console.log('[build-config] js/config.js generado correctamente');
