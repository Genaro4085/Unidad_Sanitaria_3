import sharp from 'sharp';

const { data, info } = await sharp('assets/header.png').raw().toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;

function sample(x, y) {
  const px = Math.min(w - 1, Math.max(0, Math.round(x)));
  const py = Math.min(h - 1, Math.max(0, Math.round(y)));
  const i = (py * w + px) * info.channels;
  return { r: data[i], g: data[i + 1], b: data[i + 2] };
}

console.log('Size:', w, 'x', h);

// Scan horizontal line at y=45 for color transitions
const y = 45;
const colors = [];
for (let x = 0; x < w; x += 2) {
  const c = sample(x, y);
  const key = `${Math.round(c.r/16)},${Math.round(c.g/16)},${Math.round(c.b/16)}`;
  colors.push({ x, ...c });
}

// Find cyan: b and g high, characteristic of #00B5CC area
for (const label of [
  [140, 38], [180, 38], [220, 50], [280, 50], [330, 50],
  [180, 70], [250, 70], [700, 45], [700, 65], [850, 65],
  [60, 70], [500, 30], [900, 40]
]) {
  const c = sample(label[0], label[1]);
  console.log(`(${label[0]},${label[1]}): rgb(${c.r},${c.g},${c.b})`);
}

// Cyan cluster on SANITARIA - scan
let cy = [];
for (let y = 42; y < 58; y++) {
  for (let x = 155; x < 280; x++) {
    const c = sample(x, y);
    if (c.g >= 140 && c.b >= 160 && c.r < 80) cy.push(c);
  }
}
if (cy.length) {
  const a = cy.reduce((t, c) => ({ r: t.r + c.r, g: t.g + c.g, b: t.b + c.b }), { r: 0, g: 0, b: 0 });
  console.log('CYAN:', Math.round(a.r / cy.length), Math.round(a.g / cy.length), Math.round(a.b / cy.length));
}

// Navy/dark on N3
let nv = [];
for (let y = 42; y < 58; y++) {
  for (let x = 300; x < 360; x++) {
    const c = sample(x, y);
    if (c.r < 40 && c.g < 50 && c.b < 70) nv.push(c);
  }
}
if (nv.length) {
  const a = nv.reduce((t, c) => ({ r: t.r + c.r, g: t.g + c.g, b: t.b + c.b }), { r: 0, g: 0, b: 0 });
  console.log('NAVY:', Math.round(a.r / nv.length), Math.round(a.g / nv.length), Math.round(a.b / nv.length));
}

// Black UNIDAD
let bk = [];
for (let y = 22; y < 36; y++) {
  for (let x = 118; x < 175; x++) {
    const c = sample(x, y);
    if (c.r < 35 && c.g < 35 && c.b < 35) bk.push(c);
  }
}
if (bk.length) {
  const a = bk.reduce((t, c) => ({ r: t.r + c.r, g: t.g + c.g, b: t.b + c.b }), { r: 0, g: 0, b: 0 });
  console.log('BLACK:', Math.round(a.r / bk.length), Math.round(a.g / bk.length), Math.round(a.b / bk.length));
}

// Buenos Aires cyan
let ba = [];
for (let y = 48; y < 72; y++) {
  for (let x = 720; x < 920; x++) {
    const c = sample(x, y);
    if (c.g >= 140 && c.b >= 160 && c.r < 80) ba.push(c);
  }
}
if (ba.length) {
  const a = ba.reduce((t, c) => ({ r: t.r + c.r, g: t.g + c.g, b: t.b + c.b }), { r: 0, g: 0, b: 0 });
  console.log('BA CYAN:', Math.round(a.r / ba.length), Math.round(a.g / ba.length), Math.round(a.b / ba.length));
}

// Logo stroke navy
let lg = [];
for (let y = 50; y < 120; y++) {
  for (let x = 25; x < 55; x++) {
    const c = sample(x, y);
    if (c.r < 30 && c.g < 60 && c.b < 90 && c.b > c.r) lg.push(c);
  }
}
if (lg.length) {
  const a = lg.reduce((t, c) => ({ r: t.r + c.r, g: t.g + c.g, b: t.b + c.b }), { r: 0, g: 0, b: 0 });
  console.log('LOGO NAVY:', Math.round(a.r / lg.length), Math.round(a.g / lg.length), Math.round(a.b / lg.length));
}

// Subtext
let sub = [];
for (let y = 78; y < 95; y++) {
  for (let x = 118; x < 450; x++) {
    const c = sample(x, y);
    if (c.r < 35 && c.g < 35 && c.b < 35) sub.push(c);
  }
}
if (sub.length) {
  const a = sub.reduce((t, c) => ({ r: t.r + c.r, g: t.g + c.g, b: t.b + c.b }), { r: 0, g: 0, b: 0 });
  console.log('SUB:', Math.round(a.r / sub.length), Math.round(a.g / sub.length), Math.round(a.b / sub.length));
}
