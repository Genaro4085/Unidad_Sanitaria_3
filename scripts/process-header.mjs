import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '../assets/header-source.jpg');
const out = path.join(__dirname, '../assets/header.png');

const THRESHOLD = 80;

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixels = Buffer.from(data);
for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];
  const max = Math.max(r, g, b);
  if (max <= THRESHOLD) {
    pixels[i + 3] = 0;
  }
}

await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
  .trim({ threshold: 10 })
  .png()
  .toFile(out);

const meta = await sharp(out).metadata();
console.log('OK:', out, meta.width + 'x' + meta.height);
