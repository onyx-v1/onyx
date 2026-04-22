/**
 * generate-icons.js
 * Pure Node.js — no external packages.
 *
 * Creates a valid Windows ICO file by embedding the PNG directly.
 * PNG-in-ICO format is supported on Windows Vista and later.
 *
 * ICO format reference: https://en.wikipedia.org/wiki/ICO_(file_format)
 */

const fs   = require('fs');
const path = require('path');

const resourcesDir = path.join(__dirname, '..', 'resources');
const pngPath      = path.join(resourcesDir, 'icon.png');

if (!fs.existsSync(pngPath)) {
  console.error('❌ resources/icon.png not found');
  process.exit(1);
}

const pngData = fs.readFileSync(pngPath);

// Read width/height from PNG IHDR chunk (bytes 16-23)
const width  = pngData.readUInt32BE(16);
const height = pngData.readUInt32BE(20);

// ICO stores 0 to mean 256 when width/height ≥ 256
const icoW = width  >= 256 ? 0 : width;
const icoH = height >= 256 ? 0 : height;

// ICO layout:
//  6  bytes — ICONDIR header
//  16 bytes — one ICONDIRENTRY
//  N  bytes — PNG data

const headerSize = 6;
const entrySize  = 16;
const dataOffset = headerSize + entrySize;
const fileSize   = dataOffset + pngData.length;

const buf = Buffer.alloc(fileSize);
let offset = 0;

// ICONDIR header
buf.writeUInt16LE(0,    offset);      offset += 2;  // reserved
buf.writeUInt16LE(1,    offset);      offset += 2;  // type: 1 = ICO
buf.writeUInt16LE(1,    offset);      offset += 2;  // count: 1 image

// ICONDIRENTRY
buf.writeUInt8(icoW,    offset);      offset += 1;  // width
buf.writeUInt8(icoH,    offset);      offset += 1;  // height
buf.writeUInt8(0,       offset);      offset += 1;  // color count (0 = no palette)
buf.writeUInt8(0,       offset);      offset += 1;  // reserved
buf.writeUInt16LE(1,    offset);      offset += 2;  // color planes
buf.writeUInt16LE(32,   offset);      offset += 2;  // bits per pixel
buf.writeUInt32LE(pngData.length, offset); offset += 4; // image data size
buf.writeUInt32LE(dataOffset, offset);     offset += 4; // image data offset

// PNG data
pngData.copy(buf, dataOffset);

const icoPath  = path.join(resourcesDir, 'icon.ico');
const trayPath = path.join(resourcesDir, 'tray.ico');

fs.writeFileSync(icoPath,  buf);
fs.writeFileSync(trayPath, buf);

console.log(`✅ icon.ico  — ${fileSize} bytes  (${width}×${height})`);
console.log(`✅ tray.ico  — ${fileSize} bytes  (copy of icon.ico)`);
