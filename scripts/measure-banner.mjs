import sharp from 'sharp';

const { data, info } = await sharp('assets/header.png').raw().toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;

function sample(x, y) {
  const i = (Math.round(y) * w + Math.round(x)) * info.channels;
  return { r: data[i], g: data[i + 1], b: data[i + 2] };
}

// Find vertical divider columns (light gray vertical lines)
for (let x = 100; x < 650; x++) {
  let gray = 0;
  for (let y = 30; y < 130; y++) {
    const c = sample(x, y);
    if (c.r > 180 && c.g > 180 && c.b > 180 && Math.abs(c.r - c.g) < 20) gray++;
  }
  if (gray > 60) console.log('vline ~', x);
}

// Bounding box cyan text sanitaria
let minX = w, maxX = 0, minY = h, maxY = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const c = sample(x, y);
    if (c.g >= 140 && c.b >= 160 && c.r < 80) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
}
console.log('cyan bbox', { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY });

// Black pixels bbox (text)
minX = w; maxX = 0; minY = h; maxY = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const c = sample(x, y);
    if (c.r < 40 && c.g < 40 && c.b < 50) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
}
console.log('dark bbox all', { minX, maxX, minY, maxY });

// Logo bbox (navy stroke)
minX = w; maxX = 0; minY = h; maxY = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < 120; x++) {
    const c = sample(x, y);
    if ((c.r < 50 && c.b > 80 && c.g < 100) || (c.g >= 150 && c.b >= 180 && c.r < 60)) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
}
console.log('logo bbox', { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY });
