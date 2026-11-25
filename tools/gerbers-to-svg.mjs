// Usage: node gerbers-to-svg.mjs <gerber-dir> <out-dir>
// Writes stackup-top.svg / stackup-bottom.svg (realistic renders) and one SVG per layer.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pcbStackup = require('pcb-stackup');
const gerberToSvg = require('gerber-to-svg');
const whatsThatGerber = require('whats-that-gerber');

const [, , inDir, outDir] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const files = fs.readdirSync(inDir).filter(f => !f.startsWith('.')).map(f => path.join(inDir, f));
const types = whatsThatGerber(files);
const layers = files
  .filter(f => types[f] && types[f].type)
  .map(f => ({ filename: f, type: types[f].type, side: types[f].side, gerber: fs.createReadStream(f) }));
console.log(layers.map(l => `${path.basename(l.filename)} -> ${l.side}/${l.type}`).join('\n'));

const stack = await pcbStackup(layers, { useOutline: true });
fs.writeFileSync(path.join(outDir, 'stackup-top.svg'), stack.top.svg);
fs.writeFileSync(path.join(outDir, 'stackup-bottom.svg'), stack.bottom.svg);

for (const f of files.filter(f => types[f] && types[f].type)) {
  const t = types[f];
  const svg = await new Promise((res, rej) => gerberToSvg(fs.readFileSync(f, 'utf8'), { attributes: { color: 'currentColor' } }, (e, s) => e ? rej(e) : res(s)));
  fs.writeFileSync(path.join(outDir, `layer-${t.side}-${t.type}.svg`), svg);
}
console.log('done');
