/**
 * Genera iconos PNG PWA desde SVG (requiere sharp).
 * Ejecutar: npm run pwa:icons
 */
import { mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('[pwa:icons] sharp no instalado — omitiendo PNG (ejecutá npm install)');
    process.exit(0);
  }

  mkdirSync(outDir, { recursive: true });
  const iconSvg = readFileSync(join(outDir, 'icon.svg'));
  const maskableSvg = readFileSync(join(outDir, 'icon-maskable.svg'));

  for (const size of sizes) {
    await sharp(iconSvg).resize(size, size).png({ compressionLevel: 9 }).toFile(join(outDir, `icon-${size}.png`));
    console.log(`  icon-${size}.png`);
  }

  for (const size of [192, 512]) {
    await sharp(maskableSvg).resize(size, size).png({ compressionLevel: 9 }).toFile(join(outDir, `icon-maskable-${size}.png`));
    console.log(`  icon-maskable-${size}.png`);
  }

  console.log('[pwa:icons] Iconos generados en /icons');
}

main().catch(err => {
  console.error('[pwa:icons]', err);
  process.exit(1);
});
