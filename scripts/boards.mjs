// npm run boards [N ...]
// For every boards/board-N/gerbers/*.zip (or only the boards you name), regenerate:
//   boards/board-N/svg/stackup-top.svg, stackup-bottom.svg, layers/*.svg, board-N-layout.svg
// then copy the layout + realistic render into src/assets/boards/board-N/svg/ for the site,
// and the zip into public/downloads/board-N-gerbers.zip.
// Needs: node, python3, unzip (all standard on macOS / Linux).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2).map(Number).filter(Boolean);
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit', cwd: ROOT });

const boardDirs = fs.readdirSync(path.join(ROOT, 'boards'))
  .map((d) => ({ d, n: Number(d.match(/^board-(\d+)$/)?.[1]) }))
  .filter(({ n }) => n && (!only.length || only.includes(n)))
  .sort((a, b) => a.n - b.n);

/** The directory (inside the unzipped tree) holding the most files — Gerber zips are often nested. */
function gerberDir(dir) {
  let best = { dir, count: 0 };
  const walk = (d) => {
    const entries = fs.readdirSync(d, { withFileTypes: true }).filter((e) => !e.name.startsWith('.') && e.name !== '__MACOSX');
    const files = entries.filter((e) => e.isFile()).length;
    if (files > best.count) best = { dir: d, count: files };
    entries.filter((e) => e.isDirectory()).forEach((e) => walk(path.join(d, e.name)));
  };
  walk(dir);
  return best.dir;
}

let done = 0;
for (const { d, n } of boardDirs) {
  const gdir = path.join(ROOT, 'boards', d, 'gerbers');
  const zips = fs.existsSync(gdir) ? fs.readdirSync(gdir).filter((f) => f.toLowerCase().endsWith('.zip')) : [];
  if (!zips.length) { console.log(`· ${d}: no Gerber zip in boards/${d}/gerbers/ — skipped`); continue; }
  if (zips.length > 1) console.log(`! ${d}: several zips, using ${zips[0]}`);
  const zip = path.join(gdir, zips[0]);
  console.log(`\n▶ ${d}: ${zips[0]}`);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `${d}-`));
  const unz = path.join(tmp, 'gerbers');
  const out = path.join(tmp, 'svg');
  try {
    run('unzip', ['-q', '-o', zip, '-d', unz]);
    run('node', ['tools/gerbers-to-svg.mjs', gerberDir(unz), out]);
    const layout = path.join(out, `board-${n}-layout.svg`);
    run('python3', ['tools/theme_layout.py', out, layout, `Board ${n} top copper layout`]);

    // Keep the full set next to the source files...
    const svgDir = path.join(ROOT, 'boards', d, 'svg');
    fs.mkdirSync(path.join(svgDir, 'layers'), { recursive: true });
    for (const f of fs.readdirSync(out)) {
      const dest = f.startsWith('layer-') ? path.join(svgDir, 'layers', f) : path.join(svgDir, f);
      fs.copyFileSync(path.join(out, f), dest);
    }
    // ...and give the site what it renders.
    const assets = path.join(ROOT, 'src/assets/boards', d, 'svg');
    fs.mkdirSync(assets, { recursive: true });
    fs.copyFileSync(layout, path.join(assets, `board-${n}-layout.svg`));
    fs.copyFileSync(path.join(out, 'stackup-top.svg'), path.join(assets, 'stackup-top.svg'));
    fs.mkdirSync(path.join(ROOT, 'public/downloads'), { recursive: true });
    fs.copyFileSync(zip, path.join(ROOT, 'public/downloads', `${d}-gerbers.zip`));
    done++;
    console.log(`✓ ${d}: src/assets/boards/${d}/svg/ updated, public/downloads/${d}-gerbers.zip copied`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
console.log(`\n${done} board(s) regenerated.`);
if (done) console.log(`In src/content/boards/board-N.md set:\n  layout_svg: svg/board-N-layout.svg\n  layout_placeholder: false\n  photo_fallback: svg/stackup-top.svg\n  links.gerbers: /downloads/board-N-gerbers.zip`);
