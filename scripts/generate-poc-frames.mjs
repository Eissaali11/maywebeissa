import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ -1) >>> 0;
}

function makePng(width, height, fn) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type None
    for (let x = 0; x < width; x++) {
      const [r, g, b] = fn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 3;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const desktopDir = path.join(process.cwd(), 'public', 'motion', 'poc', 'hero', 'desktop');
const mobileDir = path.join(process.cwd(), 'public', 'motion', 'poc', 'hero', 'mobile');
const heroDir = path.join(process.cwd(), 'public', 'motion', 'poc', 'hero');

ensureDir(desktopDir);
ensureDir(mobileDir);

// Generate Poster
const poster = makePng(320, 180, (x, y, w, h) => {
  const bgR = 15 + Math.floor((x / w) * 30);
  const bgG = 20 + Math.floor((y / h) * 40);
  const bgB = 35 + Math.floor((x / w) * 50);
  return [bgR, bgG, bgB];
});
fs.writeFileSync(path.join(heroDir, 'poster.png'), poster);
console.log('Created poster.png');

// Generate 24 Desktop Frames (320x180)
for (let i = 1; i <= 24; i++) {
  const progress = (i - 1) / 23;
  const numStr = String(i).padStart(4, '0');

  const png = makePng(320, 180, (x, y, w, h) => {
    // Base dark gradient
    let r = Math.floor(13 + progress * 40);
    let g = Math.floor(17 + (1 - progress) * 30);
    let b = Math.floor(23 + progress * 60);

    // Bottom progress bar
    if (y > h - 10) {
      if (x / w <= progress) {
        return [0, 210, 255]; // Cyan active progress bar
      } else {
        return [40, 50, 60];
      }
    }

    // Grid lines
    if (x % 32 === 0 || y % 18 === 0) {
      r = Math.min(255, r + 20);
      g = Math.min(255, g + 20);
      b = Math.min(255, b + 30);
    }

    // Central graphic changing per state
    const cx = w / 2;
    const cy = h / 2;
    const dx = x - cx;
    const dy = y - cy;
    const distSq = dx * dx + dy * dy;
    const radiusSq = (30 + progress * 30) ** 2;

    if (distSq < radiusSq && distSq > radiusSq - 300) {
      return [Math.floor(100 + progress * 155), 180, 255];
    }

    return [r, g, b];
  });

  fs.writeFileSync(path.join(desktopDir, `frame-${numStr}.png`), png);
}
console.log('Created 24 Desktop POC frames');

// Generate 16 Mobile Frames (180x320)
for (let i = 1; i <= 16; i++) {
  const progress = (i - 1) / 15;
  const numStr = String(i).padStart(4, '0');

  const png = makePng(180, 320, (x, y, w, h) => {
    let r = Math.floor(13 + progress * 40);
    let g = Math.floor(17 + (1 - progress) * 30);
    let b = Math.floor(23 + progress * 60);

    if (y > h - 10) {
      if (x / w <= progress) {
        return [0, 210, 255];
      } else {
        return [40, 50, 60];
      }
    }

    if (x % 20 === 0 || y % 32 === 0) {
      r = Math.min(255, r + 20);
      g = Math.min(255, g + 20);
      b = Math.min(255, b + 30);
    }

    const cx = w / 2;
    const cy = h / 2;
    const dx = x - cx;
    const dy = y - cy;
    const distSq = dx * dx + dy * dy;
    const radiusSq = (20 + progress * 20) ** 2;

    if (distSq < radiusSq && distSq > radiusSq - 200) {
      return [Math.floor(100 + progress * 155), 180, 255];
    }

    return [r, g, b];
  });

  fs.writeFileSync(path.join(mobileDir, `frame-${numStr}.png`), png);
}
console.log('Created 16 Mobile POC frames');
