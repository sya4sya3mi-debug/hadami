/**
 * Generates icon-192.png and icon-512.png for PWA
 * Uses only Node.js built-ins (no external dependencies)
 * Creates minimal valid PNG files with a teal background and white "H"
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

// Ensure public directory exists
mkdirSync(publicDir, { recursive: true });

// PNG file format helpers
function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function uint32BE(n) {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function chunk(type, data) {
  const typeBytes = [...type].map((c) => c.charCodeAt(0));
  const length = uint32BE(data.length);
  const crcData = [...typeBytes, ...data];
  const crc = uint32BE(crc32(crcData));
  return [...length, ...typeBytes, ...data, ...crc];
}

function adler32(data) {
  let a = 1, b = 0;
  for (const byte of data) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return (b << 16) | a;
}

function deflateStore(data) {
  // Non-compressed deflate block (BTYPE=00)
  const blocks = [];
  const blockSize = 65535;
  for (let i = 0; i < data.length; i += blockSize) {
    const block = data.slice(i, i + blockSize);
    const isLast = i + blockSize >= data.length;
    const len = block.length;
    const nlen = (~len) & 0xffff;
    blocks.push(
      isLast ? 0x01 : 0x00,
      len & 0xff, (len >> 8) & 0xff,
      nlen & 0xff, (nlen >> 8) & 0xff,
      ...block
    );
  }
  // zlib wrapper: CMF=0x78, FLG=0x01, deflate data, Adler-32
  const adler = adler32(data);
  return [
    0x78, 0x01,
    ...blocks,
    (adler >>> 24) & 0xff,
    (adler >>> 16) & 0xff,
    (adler >>> 8) & 0xff,
    adler & 0xff,
  ];
}

function generatePNG(size) {
  // Background: #5BBFAD (teal) = R:91 G:191 B:173
  const R = 91, G = 191, B = 173;

  // Draw pixels: teal background with white "H" lettermark
  const pixels = new Uint8Array(size * size * 3);
  pixels.fill(0);

  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels[i * 3] = R;
    pixels[i * 3 + 1] = G;
    pixels[i * 3 + 2] = B;
  }

  // Draw white "H" — scale based on icon size
  const strokeW = Math.max(1, Math.round(size * 0.08));
  const margin = Math.round(size * 0.25);
  const top = Math.round(size * 0.2);
  const bottom = Math.round(size * 0.8);
  const mid = Math.round(size * 0.5);
  const midH = Math.round(size * 0.06);

  function fillRect(x0, y0, x1, y1) {
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (x >= 0 && x < size && y >= 0 && y < size) {
          const idx = (y * size + x) * 3;
          pixels[idx] = 255;
          pixels[idx + 1] = 255;
          pixels[idx + 2] = 255;
        }
      }
    }
  }

  // Left vertical bar
  fillRect(margin, top, margin + strokeW, bottom);
  // Right vertical bar
  fillRect(size - margin - strokeW, top, size - margin, bottom);
  // Horizontal crossbar
  fillRect(margin, mid - midH, size - margin, mid + midH);

  // Build PNG: scanlines with filter byte 0 (None)
  const scanlines = [];
  for (let y = 0; y < size; y++) {
    scanlines.push(0x00); // filter type: None
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 3;
      scanlines.push(pixels[i], pixels[i + 1], pixels[i + 2]);
    }
  }

  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const ihdr = chunk("IHDR", [
    ...uint32BE(size), ...uint32BE(size),
    8,    // bit depth
    2,    // color type: RGB
    0, 0, 0, // compression, filter, interlace
  ]);
  const idat = chunk("IDAT", deflateStore(scanlines));
  const iend = chunk("IEND", []);

  return Buffer.from([...signature, ...ihdr, ...idat, ...iend]);
}

for (const size of [192, 512]) {
  const png = generatePNG(size);
  const outPath = join(publicDir, `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`Created: icon-${size}.png (${png.length} bytes)`);
}

console.log("Done! Icons generated in public/");
