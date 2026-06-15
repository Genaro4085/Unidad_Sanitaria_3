/**
 * Sella BUILD_ID en sw.js para invalidar cachés en cada deploy.
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const swPath = join(root, 'sw.js');
const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 10)
  || process.env.VERCEL_DEPLOYMENT_ID?.slice(0, 10)
  || `local-${Date.now().toString(36)}`;

let sw = readFileSync(swPath, 'utf8');
if (!sw.includes('__BUILD_ID__')) {
  console.warn('[stamp-sw] __BUILD_ID__ no encontrado en sw.js');
  process.exit(0);
}
sw = sw.replace('__BUILD_ID__', buildId);
writeFileSync(swPath, sw, 'utf8');
console.log('[stamp-sw] BUILD_ID =', buildId);
