/**
 * Generates PWA icons (192x192 and 512x512) as solid-color PNGs.
 * Uses only Node.js built-in modules (fs, zlib). Brand color: #7C5CFF.
 */
import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

// Brand purple: #7C5CFF -> R=124, G=92, B=255, A=255
const R = 124, G = 92, B = 255, A = 255;

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let k = n;
    for (let i = 0; i < 8; i++) k = (k & 1) ? (0xedb88320 ^ (k >>> 1)) : (k >>> 1);
    table[n] = k;
  }
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writeChunk(out, type, data) {
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  out.push(len, typeAndData, crc);
}

function createPng(width, height) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const out = [signature];

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace
  writeChunk(out, 'IHDR', ihdr);

  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter byte: None
    for (let x = 0; x < width; x++) {
      raw.push(R, G, B, A);
    }
  }
  const idatData = zlib.deflateSync(Buffer.from(raw), { level: 9 });
  writeChunk(out, 'IDAT', idatData);
  writeChunk(out, 'IEND', Buffer.alloc(0));

  return Buffer.concat(out);
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const sizes = [192, 512];
for (const size of sizes) {
  const png = createPng(size, size);
  const file = path.join(publicDir, `icon-${size}.png`);
  fs.writeFileSync(file, png);
  console.log(`Written ${file}`);
}

// Also write icon.png as 512 for favicon/legacy (if not present)
const iconPath = path.join(publicDir, 'icon.png');
if (!fs.existsSync(iconPath)) {
  fs.writeFileSync(iconPath, createPng(512, 512));
  console.log(`Written ${iconPath}`);
}

console.log('PWA icons generated.');
