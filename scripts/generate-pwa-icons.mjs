/**
 * Genera iconos PWA desde icons/icon-source.png.
 * Soporta fondo negro o cuadrícula gris (transparencia real).
 * Ejecutar: npm run pwa:icons
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'icons');
const sourcePath = join(outDir, 'icon-source.png');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const DARK_THRESHOLD = 18;

function isDarkPixel(data, i) {
  return data[i] <= DARK_THRESHOLD && data[i + 1] <= DARK_THRESHOLD && data[i + 2] <= DARK_THRESHOLD;
}

function isCheckerGray(r, g, b) {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  const avg = (r + g + b) / 3;
  return spread < 12 && avg >= 228 && avg < 250;
}

function isLogoColor(r, g, b) {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return spread > 22 || (r < 45 && b > 110) || (g > 130 && b > 130 && r < 50);
}

function isLightCorner(r, g, b) {
  return r > 200 && g > 200 && b > 200;
}

/** Elimina negro conectado al borde (icono anterior). */
function removeOuterBlackBackground(rgba, width, height) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const pi = idx * 4;
    if (!isDarkPixel(rgba, pi)) return;
    visited[idx] = 1;
    queue[tail++] = idx;
  };

  for (let x = 0; x < width; x++) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  while (head < tail) {
    const idx = queue[head++];
    rgba[idx * 4 + 3] = 0;
    const x = idx % width;
    const y = (idx - x) / width;
    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
  }
}

function detectCardBounds(rgba, width, height) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = rgba[i];
      const g = rgba[i + 1];
      const b = rgba[i + 2];
      if (isLogoColor(r, g, b)) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const contentW = maxX - minX + 1;
  const contentH = maxY - minY + 1;
  const padX = Math.round(contentW * 0.055);
  const padY = Math.round(contentH * 0.018);
  const radius = Math.round(Math.min(contentW, contentH) * 0.105);

  return {
    left: Math.max(0, minX - padX),
    top: Math.max(0, minY - padY),
    right: Math.min(width - 1, maxX + padX),
    bottom: Math.min(height - 1, maxY + padY),
    radius,
  };
}

function pointInRoundRect(x, y, left, top, right, bottom, radius) {
  if (x < left || x > right || y < top || y > bottom) return false;

  const r = radius;
  if (x < left + r && y < top + r) {
    const dx = x - (left + r);
    const dy = y - (top + r);
    return dx * dx + dy * dy <= r * r;
  }
  if (x > right - r && y < top + r) {
    const dx = x - (right - r);
    const dy = y - (top + r);
    return dx * dx + dy * dy <= r * r;
  }
  if (x < left + r && y > bottom - r) {
    const dx = x - (left + r);
    const dy = y - (bottom - r);
    return dx * dx + dy * dy <= r * r;
  }
  if (x > right - r && y > bottom - r) {
    const dx = x - (right - r);
    const dy = y - (bottom - r);
    return dx * dx + dy * dy <= r * r;
  }
  return true;
}

/** Quita cuadrícula gris fuera del ícono redondeado blanco. */
function removeCheckerboardBackground(rgba, width, height) {
  const bounds = detectCardBounds(rgba, width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const inside = pointInRoundRect(x, y, bounds.left, bounds.top, bounds.right, bounds.bottom, bounds.radius);
      if (!inside) {
        rgba[i + 3] = 0;
        continue;
      }
      if (isCheckerGray(rgba[i], rgba[i + 1], rgba[i + 2])) {
        rgba[i + 3] = 0;
      }
    }
  }
}

function usesCheckerboardBackground(rgba, width, height) {
  const pts = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  let lightCorners = 0;
  let grayCorners = 0;
  for (const [x, y] of pts) {
    const i = (y * width + x) * 4;
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    if (isLightCorner(r, g, b)) lightCorners++;
    if (isCheckerGray(r, g, b)) grayCorners++;
  }
  return lightCorners >= 3 || grayCorners >= 2;
}

function processSourceRgba(rgba, width, height) {
  if (usesCheckerboardBackground(rgba, width, height)) {
    removeCheckerboardBackground(rgba, width, height);
  } else {
    removeOuterBlackBackground(rgba, width, height);
  }
}

async function loadProcessedMaster(sharp) {
  if (!existsSync(sourcePath)) {
    console.warn('[pwa:icons] Sin icon-source.png — usando icon.svg');
    return sharp(readFileSync(join(outDir, 'icon.svg'))).png().toBuffer();
  }

  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.from(data);
  processSourceRgba(rgba, info.width, info.height);

  return sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 8 })
    .png()
    .toBuffer();
}

async function fitIcon(sharp, master, size, paddingRatio = 0) {
  const inner = paddingRatio > 0 ? Math.round(size * (1 - paddingRatio * 2)) : size;
  const logo = await sharp(master)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function fitMaskable(sharp, master, size) {
  const inner = Math.round(size * 0.94);
  const logo = await sharp(master)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 245, g: 242, b: 235, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('[pwa:icons] sharp no instalado — omitiendo PNG (ejecutá npm install)');
    process.exit(0);
  }

  mkdirSync(outDir, { recursive: true });
  const master = await loadProcessedMaster(sharp);

  writeFileSync(join(outDir, 'icon.png'), await fitIcon(sharp, master, 512));
  console.log('  icon.png (512, transparente)');

  for (const size of sizes) {
    const buf = await fitIcon(sharp, master, size);
    writeFileSync(join(outDir, `icon-${size}.png`), buf);
    console.log(`  icon-${size}.png`);
  }

  for (const size of [32, 192, 512]) {
    const buf = size === 32
      ? await fitIcon(sharp, master, 32, 0)
      : await fitMaskable(sharp, master, size);
    const name = size === 32 ? 'favicon-32.png' : `icon-maskable-${size}.png`;
    writeFileSync(join(outDir, name), buf);
    console.log(`  ${name}`);
  }

  writeFileSync(join(root, 'favicon-32.png'), await fitIcon(sharp, master, 32, 0));
  console.log('  ../favicon-32.png');

  console.log('[pwa:icons] Iconos US3 generados con fondo transparente');
}

main().catch((err) => {
  console.error('[pwa:icons]', err);
  process.exit(1);
});
