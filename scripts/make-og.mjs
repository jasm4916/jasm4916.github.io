// node scripts/make-og.mjs — renders public/og.png (1200×630) and favicon PNGs with headless Chrome.
// Only needed if you change the name/tagline. Set CHROME=/path/to/chrome if it isn't in the default spot.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const font = (pkg, file) => pathToFileURL(path.join(ROOT, 'node_modules/@fontsource', pkg, 'files', file)).href;

let wave = 'M0 250';
for (let x = 0; x < 1300; x += 100) wave += ` V130 H${x + 60} V250 H${x + 100}`;
const grid = [];
for (let x = 120; x < 1200; x += 120) grid.push(`M${x} 0V630`);
for (let y = 63; y < 630; y += 63) grid.push(`M0 ${y}H1200`);

const og = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:CP;font-weight:700;src:url(${font('chakra-petch', 'chakra-petch-latin-700-normal.woff2')})}
@font-face{font-family:JB;font-weight:400;src:url(${font('jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff2')})}
html,body{margin:0;width:1200px;height:630px;background:#050607;overflow:hidden}
.t{position:absolute;inset:0;padding:56px 64px;display:flex;flex-direction:column;justify-content:space-between;font-family:JB;color:#a3a8b0;font-size:22px}
h1{margin:0;font-family:CP;font-weight:700;font-size:150px;line-height:.9;color:#f4f5f6;text-shadow:0 0 30px #000}
p{margin:16px 0 0;font-size:30px;color:#d2d5da;text-shadow:0 0 14px #000}
.top{display:flex;justify-content:space-between}.ch{color:#f5d547}.run{color:#6fe39a}
.dots span{display:inline-block;width:14px;height:14px;border-radius:50%;margin-left:10px}
</style></head><body>
<svg width="1200" height="630" viewBox="0 0 1200 630" style="position:absolute;inset:0">
<path d="${grid.join('')}" stroke="#26332e" stroke-width="1.5"/><path d="M600 0V630M0 315H1200" stroke="#3d5249" stroke-width="2"/>
<path d="${wave}" transform="translate(-30 60)" fill="none" stroke="#f5d547" stroke-width="5" stroke-linejoin="round" style="filter:drop-shadow(0 0 8px #f5d547)"/>
</svg>
<div class="t"><div class="top"><span class="ch">PCB PORTFOLIO · 4 BOARDS · CU BOULDER ECEN 3730</span><span class="run">● RUN</span></div>
<div><h1>JACOB SMITH</h1><p>I design, build and measure circuit boards.</p></div>
<div class="top"><span>SCHEMATIC → LAYOUT → FAB → BRING-UP → RESULTS</span><span class="dots"><span style="background:#f5d547"></span><span style="background:#4fd1e8"></span><span style="background:#f06bd0"></span><span style="background:#6fe39a"></span></span></div></div>
</body></html>`;

const icon = (size) => `<!doctype html><html><body style="margin:0;background:transparent">
${fs.readFileSync(path.join(ROOT, 'public/favicon.svg'), 'utf8').replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'));
const shot = (html, out, w, h, extra = []) => {
  const f = path.join(tmp, 'p.html');
  fs.writeFileSync(f, html);
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${w},${h}`, `--screenshot=${path.join(ROOT, 'public', out)}`, '--virtual-time-budget=3000', ...extra, pathToFileURL(f).href], { stdio: 'ignore' });
  console.log('wrote public/' + out);
};
shot(og, 'og.png', 1200, 630);
shot(icon(64), 'favicon.png', 64, 64, ['--default-background-color=00000000']);
shot(icon(180), 'apple-touch-icon.png', 180, 180);
fs.rmSync(tmp, { recursive: true, force: true });
