import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { marked } from 'marked';
import YAML from 'yaml';

/* ---------- paths ---------- */

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
/** Prefix a public/ path with the deploy base ("/downloads/x.pdf" -> "/repo/downloads/x.pdf"). */
export const withBase = (p: string) => (/^(https?:|mailto:|#)/.test(p) ? p : BASE + (p.startsWith('/') ? p : '/' + p));

const images = import.meta.glob<ImageMetadata>('/src/assets/boards/**/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
});
const rawSvgs = import.meta.glob<string>('/src/assets/boards/**/*.svg', { eager: true, query: '?raw', import: 'default' });
const urls = import.meta.glob<string>('/src/assets/boards/**/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const assetKey = (slug: string, rel: string) => `/src/assets/boards/${slug}/${rel.replace(/^\.?\//, '')}`;

function need<T>(map: Record<string, T>, key: string): T {
  const v = map[key];
  if (v === undefined) throw new Error(`Missing board asset: ${key}`);
  return v;
}
export const boardImage = (slug: string, rel: string) => need(images, assetKey(slug, rel));
export const boardSvg = (slug: string, rel: string) => need(rawSvgs, assetKey(slug, rel));
/** URL for a link: "/..." is a public file; anything else is a board asset. */
export const boardUrl = (slug: string, rel: string) =>
  rel.startsWith('/') || /^https?:/.test(rel) ? withBase(rel) : need(urls, assetKey(slug, rel));

/* ---------- placeholders + markdown ---------- */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Wrap [bracketed placeholders] in text nodes of an HTML string so they're visibly marked. */
function markPlaceholders(html: string) {
  return html
    .split(/(<[^>]+>)/)
    .map((part) => (part.startsWith('<') ? part : part.replace(/\[([^\[\]<>]+)\]/g, '<mark class="ph">[$1]</mark>')))
    .join('');
}
export const isPlaceholder = (s?: string | null) => !s || /^\s*\[.*\]\s*$/.test(s);
/** Plain string -> safe HTML with placeholders marked. */
export const text = (s?: string | null) => markPlaceholders(esc(s ?? ''));
/** Markdown -> HTML with placeholders marked and tables wrapped for scrolling. */
export function md(src: string) {
  const html = marked.parse(src.trim(), { gfm: true, async: false }) as string;
  return markPlaceholders(html)
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, '</table></div>');
}

/* ---------- boards ---------- */

export type Media =
  | { kind: 'image'; img: ImageMetadata; full: string; caption?: string; scope?: boolean }
  | { kind: 'svg'; url: string; caption?: string }
  | { kind: 'layout'; caption?: string }
  | { kind: 'compare'; a: ImageMetadata; b: ImageMetadata; aLabel: string; bLabel: string; caption?: string; aFull: string; bFull: string; simA?: string; simB?: string; verdict?: string }
  | { kind: 'placeholder'; label: string };

export type Stage = {
  label: string;
  slug: string;
  title: string;
  html: string;
  /** Two or three sentences shown by default; the full body sits behind "Full notes". */
  lead?: string;
  keys: { label: string; value: string }[];
  media?: Media;
  media2?: Media;
  gallery: { img: ImageMetadata; full: string; caption: string }[];
};

const META_KEYS = /^(lead|keys|media2?|caption2?|compare_[ab](_label)?|sim_[ab]|verdict|gallery)\s*:/;

function parseMeta(lines: string[]) {
  const meta: Record<string, any> = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\w+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (key === 'gallery' || key === 'keys') {
      const block: string[] = [];
      while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) block.push(lines[++i]);
      meta[key] = YAML.parse(block.join('\n')) ?? [];
    } else {
      // Plain "key: value" — values may contain colons, so don't YAML-parse them.
      meta[key] = rawVal.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    }
  }
  return meta;
}

function mediaFrom(slug: string, src: string | undefined, caption: string | undefined, meta: Record<string, any>): Media | undefined {
  if (!src || src === 'null') return undefined;
  if (isPlaceholder(src)) return { kind: 'placeholder', label: src };
  if (src === 'layout_svg') return { kind: 'layout', caption };
  if (src === 'compare')
    return {
      kind: 'compare',
      a: boardImage(slug, meta.compare_a),
      b: boardImage(slug, meta.compare_b),
      aLabel: meta.compare_a_label ?? '',
      bLabel: meta.compare_b_label ?? '',
      caption,
      aFull: boardUrl(slug, meta.compare_a),
      bFull: boardUrl(slug, meta.compare_b),
      // redrawn captures (src/lib/captures.ts) shown on the instrument instead of the screenshots
      simA: meta.sim_a,
      simB: meta.sim_b,
      verdict: meta.verdict,
    };
  if (src.endsWith('.svg')) return { kind: 'svg', url: boardUrl(slug, src), caption };
  // Keysight screenshots (files named *scope*) get the dark scope-screen treatment on the instrument.
  return { kind: 'image', img: boardImage(slug, src), full: boardUrl(slug, src), caption, scope: /scope/i.test(src) };
}

function parseStages(slug: string, body: string): Stage[] {
  const sections = body.split(/^## /m).slice(1);
  return sections.map((sec) => {
    const [heading, ...rest] = sec.split('\n');
    const [label, title = label] = heading.split(/\s+—\s+/).map((s) => s.trim());
    const metaStart = rest.findIndex((l) => META_KEYS.test(l));
    const bodyLines = metaStart === -1 ? rest : rest.slice(0, metaStart);
    const meta = metaStart === -1 ? {} : parseMeta(rest.slice(metaStart));
    return {
      label,
      slug: label.split(/\s/)[0].toLowerCase().replace(/[^a-z0-9-]/g, ''),
      title,
      html: md(bodyLines.join('\n')),
      lead: meta.lead,
      keys: meta.keys ?? [],
      media: mediaFrom(slug, meta.media, meta.caption, meta),
      media2: mediaFrom(slug, meta.media2, meta.caption2, meta),
      gallery: (meta.gallery ?? []).map((g: { src: string; caption: string }) => ({
        img: boardImage(slug, g.src),
        full: boardUrl(slug, g.src),
        caption: g.caption,
      })),
    };
  });
}

export type Board = CollectionEntry<'boards'>['data'] & { slug: string; stages: Stage[] };

export async function getBoards(): Promise<Board[]> {
  const entries = await getCollection('boards');
  return entries
    .map((e) => {
      const slug = e.data.slug ?? e.id;
      return { ...e.data, slug, stages: parseStages(slug, e.body ?? '') };
    })
    .sort((a, b) => a.ch - b.ch);
}

/** Strip the layout SVG's own <style> and re-scope it so its generic class names can't leak. */
export function inlineLayout(slug: string, rel: string, label: string) {
  let svg = boardSvg(slug, rel);
  const scope = `pcb-${slug}`;
  svg = svg.replace(/<style>([\s\S]*?)<\/style>/, (_, css: string) => {
    const scoped = css.replace(/(^|\})\s*([^{}]+)\{/g, (_m, close: string, sel: string) =>
      close + sel.split(',').map((s) => `.${scope} ${s.trim()}`).join(',') + '{',
    );
    return `<style>${scoped}</style>`;
  });
  return svg
    .replace(/\s+xmlns:c2pa="[^"]*"/, '')
    .replace(/<svg /, `<svg class="pcb ${scope}" focusable="false" `)
    .replace(/ role="img" aria-label="[^"]*"/, ` role="img" aria-label="${esc(label)}"`);
}

/* ---------- waveforms (ported from the prototype) ---------- */

export function wave(kind: string) {
  const W = 1600;
  let d = '';
  if (kind === 'duty60' || kind === 'duty67') {
    const hi = kind === 'duty67' ? 67 : 60;
    d = 'M0 260';
    for (let x = 0; x < W; x += 100) d += ` V140 H${x + hi} V260 H${x + 100}`;
  } else if (kind === 'good') {
    d = 'M0 300';
    for (let x = 0; x < W; x += 200) d += ` V220 H${x + 100} V300 H${x + 200}`;
  } else if (kind === 'bad') {
    d = 'M0 160';
    for (let x = 0; x < W; x += 200) {
      d += ` L${x} 60 L${x + 4} 104 L${x + 8} 70 L${x + 12} 92 L${x + 16} 78 L${x + 22} 82 H${x + 100}`;
      d += ` L${x + 100} 186 L${x + 104} 142 L${x + 108} 174 L${x + 112} 154 L${x + 116} 166 L${x + 122} 160 H${x + 200}`;
    }
  } else if (kind === 'uart') {
    const bits = [1,1,0,1,0,0,1,0,1,1,1,1,0,0,0,1,1,0,1,1,1,1,1,1,1,1,0,1,0,1,1,0,0,1,0,1,1,1,1,1];
    const bw = 20, hi = 140, lo = 260;
    let y = hi;
    d = `M0 ${hi}`;
    for (let x = 0, i = 0; x < W; x += bw, i++) {
      const ny = bits[i % bits.length] ? hi : lo;
      if (ny !== y) { d += ` V${ny}`; y = ny; }
      d += ` H${x + bw}`;
    }
  } else if (kind === 'steps') {
    const sag = [10, 22, 36, 52, 70, 92, 118, 150];
    d = 'M0 120';
    for (let i = 0, x = 0; x < W; i++, x += 100) {
      const s = sag[i % 8];
      d += ` H${x + 40} V${120 + s} H${x + 70} V120 H${x + 100}`;
    }
  }
  return d;
}
