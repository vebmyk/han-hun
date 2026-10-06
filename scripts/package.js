/* package.js – builds dist/hen-extension-<version>.zip for the Chrome Web Store / Edge Add-ons.
   Usage: node scripts/package.js. No dependencies; writes the zip itself so entry paths use "/". */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f));
const manifest = JSON.parse(read('manifest.json'));

// Only runtime files go in: no tests, docs, store text or icon sources.
const files = ['manifest.json', 'hen.js', 'content.js', 'options.html', 'options.js']
  .concat(fs.readdirSync(path.join(root, 'icons')).filter((f) => f.endsWith('.png')).map((f) => 'icons/' + f));

const problems = [];

// Everything the manifest and the options page point at must be packaged.
const referenced = [
  ...Object.values(manifest.icons || {}),
  ...Object.values((manifest.action || {}).default_icon || {}),
  ...(manifest.content_scripts || []).flatMap((c) => (c.js || []).concat(c.css || [])),
  (manifest.action || {}).default_popup,
  (manifest.options_ui || {}).page,
  ...[...read('options.html').toString().matchAll(/(?:src|href)="([^"#]+)"/g)].map((m) => m[1]),
].filter(Boolean);
for (const f of referenced) if (!files.includes(f)) problems.push(`referenced but not packaged: ${f}`);

// Each icon must really have the size its manifest key claims (PNG IHDR holds width/height).
for (const [size, f] of Object.entries(manifest.icons || {})) {
  const png = read(f);
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
  if (w !== +size || h !== +size) problems.push(`${f} is ${w}x${h}, manifest says ${size}`);
}
if (!(manifest.icons || {})['128']) problems.push('manifest.icons has no 128 entry (required by the Chrome Web Store)');

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

// Fixed timestamp (1980-01-01) so the same sources always give the same zip.
const DOS_TIME = 0, DOS_DATE = (1 << 5) | 1;

const body = [], central = [];
let offset = 0;
for (const name of files) {
  const data = read(name);
  const packed = zlib.deflateRawSync(data, { level: 9 });
  const nameBuf = Buffer.from(name);
  const crc = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);            // version needed
  local.writeUInt16LE(8, 8);             // method: deflate
  local.writeUInt16LE(DOS_TIME, 10);
  local.writeUInt16LE(DOS_DATE, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(packed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);

  const entry = Buffer.alloc(46);
  entry.writeUInt32LE(0x02014b50, 0);
  entry.writeUInt16LE(20, 4);            // version made by
  entry.writeUInt16LE(20, 6);            // version needed
  entry.writeUInt16LE(8, 10);            // method: deflate
  entry.writeUInt16LE(DOS_TIME, 12);
  entry.writeUInt16LE(DOS_DATE, 14);
  entry.writeUInt32LE(crc, 16);
  entry.writeUInt32LE(packed.length, 20);
  entry.writeUInt32LE(data.length, 24);
  entry.writeUInt16LE(nameBuf.length, 28);
  entry.writeUInt32LE(offset, 42);       // local header offset

  body.push(local, nameBuf, packed);
  central.push(entry, nameBuf);
  offset += local.length + nameBuf.length + packed.length;
}

const centralBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralBuf.length, 12);
end.writeUInt32LE(offset, 16);

const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `hen-extension-${manifest.version}.zip`);
fs.writeFileSync(out, Buffer.concat([...body, centralBuf, end]));

console.log(`${path.relative(root, out)} (${fs.statSync(out).size} bytes)`);
for (const f of files) console.log('  ' + f);
