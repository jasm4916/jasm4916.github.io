// Progressive enhancement for the scope portfolio. Everything reads as plain HTML without this.
//
// The instrument: CH keys pick a board; softkeys under the screen (or the card's Next/Back buttons)
// pick a design stage. Each stage's figure is moved from its card onto the scope screen.
const root = document.documentElement;
const $$ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => [...el.querySelectorAll<T>(sel)] as T[];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const smooth = (): ScrollBehavior => (reduce.matches ? 'auto' : 'smooth');

function replay(el: Element, cls: string, ms = 0) {
  if (reduce.matches) return;
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
  if (ms) window.setTimeout(() => el.classList.remove(cls), ms);
}

const instrument = document.querySelector<HTMLElement>('.instrument')!;
const screen = instrument.querySelector<HTMLElement>('.screen')!;
const layersEl = screen.querySelector<HTMLElement>('[data-layers]')!;
const roTop = screen.querySelector<HTMLElement>('[data-sro-top]')!;
const roBot = screen.querySelector<HTMLElement>('[data-sro-bot]')!;
const keys = $$<HTMLButtonElement>('.keys .key[role="tab"]');

type Board = {
  ch: number;
  el: HTMLElement;
  short: string;
  panels: HTMLElement[]; // [overview, stage 0, stage 1, ...]
  softkeys: HTMLButtonElement[];
  layers: (HTMLElement | null)[];
  stage: number; // -1 = overview
};

const boards: Board[] = $$<HTMLElement>('.board').map((el) => {
  const ch = Number(el.dataset.board);
  const stagePanels = $$<HTMLElement>('.panel.st', el);
  // Move each stage's figure from its card onto the scope screen.
  const layers = stagePanels.map((p, i) => {
    const media = p.querySelector<HTMLElement>(':scope > .step-media');
    if (!media) return null;
    const layer = document.createElement('div');
    layer.className = 'layer';
    layer.dataset.ch = String(ch);
    layer.dataset.stage = String(i);
    layer.dataset.cap = media.dataset.cap ?? '';
    [...media.childNodes].forEach((n) => { if (!(n instanceof HTMLElement && n.tagName === 'FIGCAPTION')) layer.append(n); });
    layersEl.append(layer);
    media.remove();
    return layer;
  });
  // With JS, the hash is ours to interpret: rename the anchors so the browser doesn't also jump to the card.
  el.id = `card-${ch}`;
  document.querySelector(`#key-${ch}`)?.setAttribute('aria-controls', el.id);
  stagePanels.forEach((p) => {
    p.id = `card-${ch}-${p.dataset.slug}`;
    document.querySelector(`#sk-${ch}-${p.dataset.slug}`)?.setAttribute('aria-controls', p.id);
  });
  return {
    ch,
    el,
    short: el.dataset.short ?? '',
    panels: [el.querySelector<HTMLElement>('.panel.ov')!, ...stagePanels],
    softkeys: $$<HTMLButtonElement>(`.softkey[data-ch="${ch}"]`),
    layers,
    stage: -1,
  };
});
const boardFor = (ch: number) => boards.find((b) => b.ch === ch);
const defaultCh = boards.find((b) => b.el.classList.contains('is-active'))?.ch ?? boards[0]?.ch;
let cur = boardFor(Number(root.dataset.ch)) ? Number(root.dataset.ch) : defaultCh;
root.dataset.ch = String(cur);
let shownLayer: HTMLElement | null = null;
let touched = false;

function setHash(h: string) {
  if (location.hash !== h) history.replaceState(null, '', h);
}

const whenIdle = (fn: () => void) => {
  const go = () => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 1500));
  if (document.readyState === 'complete') go();
  else addEventListener('load', go, { once: true });
};
/** Screen images are lazy; fetch the current stage's and the next two before they're needed. */
function preload(b: Board, i: number) {
  for (let j = i; j <= i + 2; j++) b.layers[j]?.querySelectorAll('img').forEach((im) => { im.loading = 'eager'; });
}

/* ---------- stages ---------- */
function setStage(b: Board, i: number, opts: { hash?: boolean; animate?: boolean } = {}) {
  const n = b.panels.length - 1;
  i = Math.max(-1, Math.min(n - 1, i));
  const changed = i !== b.stage;
  b.stage = i;

  // card
  b.panels.forEach((p, j) => p.classList.toggle('on', j === i + 1));
  if (changed && opts.animate !== false) replay(b.panels[i + 1], 'enter');

  // softkeys
  b.softkeys.forEach((k, j) => {
    k.setAttribute('aria-selected', String(j === i));
    k.tabIndex = j === Math.max(0, i) ? 0 : -1;
    k.classList.toggle('done', j < i);
  });

  if (b.ch !== cur) return;
  showScreen(b, opts.animate !== false);
  if (opts.hash !== false) setHash(`#board-${b.ch}${i >= 0 ? '/' + b.panels[i + 1].dataset.slug : ''}`);
}

/* ---------- redrawn captures: REF A plays, then REF B, then the verdict ---------- */
let simTimers: number[] = [];
const stopSim = () => { simTimers.forEach((t) => clearTimeout(t)); simTimers = []; };
function simShowVerdict(box: HTMLElement) {
  const v = box.querySelector('.verdict')?.textContent?.trim();
  if (!v || !box.closest('.layer.is-on')) return;
  roBot.textContent = `▸ ${v}`;
  roBot.classList.add('verdict-on');
  replay(roBot.parentElement!, 'swap');
}
function simSelect(box: HTMLElement, which: 'a' | 'b') {
  box.querySelectorAll<HTMLElement>('.ref-btn').forEach((x) => {
    const on = x.dataset.ref === which;
    x.classList.toggle('on', on);
    x.setAttribute('aria-pressed', String(on));
    if (on) x.classList.remove('hint');
  });
  box.querySelectorAll<HTMLElement>('.ref-img').forEach((x) => {
    const on = x.dataset.ref === which;
    x.classList.toggle('on', on);
    if (on) replay(x, 'play');
  });
  const seen = new Set((box.dataset.seen ?? '').split('').filter(Boolean));
  seen.add(which);
  box.dataset.seen = [...seen].join('');
  if (seen.size === 2) simTimers.push(window.setTimeout(() => simShowVerdict(box), reduce.matches ? 0 : 3200));
}
function startSim(box: HTMLElement) {
  stopSim();
  box.dataset.seen = '';
  box.dataset.touched = '';
  simSelect(box, 'a');
  if (!reduce.matches) simTimers.push(window.setTimeout(() => { if (!box.dataset.touched) simSelect(box, 'b'); }, 6500));
}

function showScreen(b: Board, animate: boolean) {
  const i = b.stage;
  root.dataset.mode = i >= 0 ? 'stage' : 'home';
  root.classList.toggle('wip', b.softkeys.length === 0);
  const next = i >= 0 ? b.layers[i] : null;
  if (next !== shownLayer) {
    stopSim();
    roBot.classList.remove('verdict-on');
    shownLayer?.classList.remove('is-on', 'enter', 'drawing');
    if (next) {
      next.classList.add('is-on');
      if (animate) {
        replay(next, 'enter');
        replay(screen, 'sweeping', 800);
        if (next.querySelector('.pcb')) replay(next, 'drawing', 2600);
        const ref = next.querySelector<HTMLElement>('.ref-btn[data-ref="b"]');
        if (ref && !next.querySelector('[data-sim]') && !ref.dataset.hinted) { ref.dataset.hinted = '1'; window.setTimeout(() => replay(ref, 'hint', 3000), 800); }
      }
      const sim = next.querySelector<HTMLElement>('[data-sim]');
      if (sim) startSim(sim);
    }
    shownLayer = next;
  }
  if (i >= 0) {
    const panel = b.panels[i + 1];
    roTop.textContent = `CH${b.ch} · STAGE ${i + 1}/${b.panels.length - 1} · ${panel.dataset.label ?? ''}`;
    roBot.textContent = next?.dataset.cap ?? '';
    preload(b, i);
  } else {
    // Home screen: warm up the first stages only once the page has loaded and gone idle,
    // so they never compete with the first paint.
    whenIdle(() => preload(b, 0));
  }
}

/** Keep the screen in view when someone steps from the bottom of a long card. */
function bringScreenIntoView(behavior: ScrollBehavior = smooth()) {
  const r = screen.getBoundingClientRect();
  if (r.top < 60 || r.bottom > innerHeight) window.scrollTo({ top: r.top + scrollY - 72, behavior });
}

/* ---------- boards ---------- */
function selectBoard(ch: number, opts: { hash?: boolean; stage?: number } = {}) {
  const b = boardFor(ch);
  if (!b) return;
  const changed = ch !== cur;
  const swap = () => {
    cur = ch;
    root.dataset.ch = String(ch);
    keys.forEach((k) => {
      const on = Number(k.dataset.ch) === ch;
      k.setAttribute('aria-selected', String(on));
      k.tabIndex = on ? 0 : -1;
    });
    boards.forEach((o) => o.el.classList.toggle('is-active', o === b));
    setStage(b, opts.stage ?? -1, { hash: false, animate: false });
    showScreen(b, false);
  };
  const vt = (document as any).startViewTransition;
  if (changed && vt && !reduce.matches) vt.call(document, swap);
  else swap();
  if (changed) replay(b.panels[b.stage + 1], 'enter');
  if (opts.hash !== false) setHash(`#board-${ch}${b.stage >= 0 ? '/' + b.panels[b.stage + 1].dataset.slug : ''}`);
}

// CH keys: roving tabindex + arrows
keys.forEach((k, i) => {
  k.addEventListener('click', () => { touched = true; selectBoard(Number(k.dataset.ch)); });
  k.addEventListener('keydown', (e) => {
    const n = keys.length;
    const map: Record<string, number> = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    const j = (map[e.key] + n) % n;
    keys[j].focus();
    selectBoard(Number(keys[j].dataset.ch));
  });
});

// softkeys: click, roving tabindex, arrows
boards.forEach((b) => {
  b.softkeys.forEach((k, i) => {
    k.addEventListener('click', () => { touched = true; setStage(b, b.stage === i ? -1 : i); });
    k.addEventListener('keydown', (e) => {
      const n = b.softkeys.length;
      const map: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: n - 1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      e.stopPropagation();
      const j = Math.max(0, Math.min(n - 1, map[e.key]));
      b.softkeys[j].focus();
      setStage(b, j);
    });
  });
});

document.addEventListener('click', (e) => {
  const t = e.target as Element;
  const go = t.closest<HTMLElement>('[data-go]');
  if (go) {
    const b = boardFor(cur);
    if (!b) return;
    touched = true;
    setStage(b, go.dataset.go === 'ov' ? -1 : Number(go.dataset.go));
    bringScreenIntoView();
    return;
  }
  const start = t.closest<HTMLAnchorElement>('[data-start]');
  if (start) {
    e.preventDefault();
    const b = boardFor(Number(start.dataset.start));
    if (b) { touched = true; setStage(b, 0); }
    return;
  }
  const next = t.closest<HTMLAnchorElement>('a[data-goto]');
  if (next) {
    e.preventDefault();
    touched = true;
    selectBoard(Number(next.dataset.goto));
    bringScreenIntoView();
    return;
  }
  const ref = t.closest<HTMLButtonElement>('.ref-btn');
  if (ref && ref.closest('[data-sim]')) {
    const box = ref.closest<HTMLElement>('[data-sim]')!;
    box.dataset.touched = '1';
    simSelect(box, ref.dataset.ref as 'a' | 'b');
    return;
  }
  if (ref) {
    const box = ref.closest<HTMLElement>('[data-refcmp]')!;
    $$<HTMLElement>('.ref-btn', box).forEach((x) => {
      const on = x === ref;
      x.classList.toggle('on', on);
      x.setAttribute('aria-pressed', String(on));
      if (on) x.classList.remove('hint');
    });
    $$<HTMLElement>('.ref-img', box).forEach((x) => x.classList.toggle('on', x.dataset.ref === ref.dataset.ref));
  }
});

// ← / → step through stages while the instrument is on screen
document.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
  if ((e.target as HTMLElement).closest('input, textarea, select, [role="tab"], dialog')) return;
  const r = screen.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  const b = boardFor(cur);
  if (!b || b.softkeys.length === 0) return;
  e.preventDefault();
  touched = true;
  setStage(b, b.stage + (e.key === 'ArrowRight' ? 1 : -1));
});

/* ---------- deep links: #board-3, #board-3/results ---------- */
function fromHash() {
  const m = location.hash.match(/^#board-(\d+)(?:\/([\w-]+))?$/);
  if (!m) return false;
  const b = boardFor(Number(m[1]));
  if (!b) return false;
  const i = m[2] ? b.panels.findIndex((p) => p.dataset.slug === m[2]) - 1 : -1;
  selectBoard(b.ch, { hash: false, stage: i });
  setStage(b, i, { hash: false });
  return true;
}
addEventListener('hashchange', () => { if (fromHash()) bringScreenIntoView(); });

/* ---------- lightbox ---------- */
const dlg = document.getElementById('lightbox') as HTMLDialogElement | null;
if (dlg && typeof dlg.showModal === 'function') {
  const img = dlg.querySelector('img')!;
  const cap = dlg.querySelector('figcaption')!;
  const count = dlg.querySelector<HTMLElement>('.lb-count')!;
  let group: HTMLAnchorElement[] = [];
  let idx = 0;
  const showImg = (i: number) => {
    idx = (i + group.length) % group.length;
    const a = group[idx];
    img.src = a.href;
    img.alt = a.querySelector('img')?.alt || a.dataset.caption || '';
    cap.textContent = a.dataset.caption ?? '';
    count.textContent = group.length > 1 ? `${idx + 1} / ${group.length}` : '';
    dlg.querySelectorAll<HTMLElement>('[data-lb="prev"],[data-lb="next"]').forEach((b) => (b.hidden = group.length < 2));
  };
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-lightbox]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    group = $$<HTMLAnchorElement>(`a[data-lightbox="${a.dataset.lightbox}"]`).filter(
      (x) => x === a || (x.offsetParent !== null && (!x.closest('.layer') || x.closest('.layer')?.getAttribute('data-ch') === String(cur))),
    );
    showImg(Math.max(0, group.indexOf(a)));
    dlg.showModal();
  });
  dlg.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-lb]');
    if (b?.dataset.lb === 'prev') showImg(idx - 1);
    else if (b?.dataset.lb === 'next') showImg(idx + 1);
    else if (b?.dataset.lb === 'close' || e.target === dlg) dlg.close();
  });
  dlg.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'ArrowLeft') showImg(idx - 1);
    else if (e.key === 'ArrowRight') showImg(idx + 1);
  });
  dlg.addEventListener('close', () => img.removeAttribute('src'));
}

/* ---------- init ---------- */
if (fromHash()) {
  // The hash also names a card panel, so the browser jumped there; bring the scope back into view.
  bringScreenIntoView('instant' as ScrollBehavior);
  addEventListener('load', () => bringScreenIntoView('instant' as ScrollBehavior), { once: true });
} else {
  selectBoard(cur, { hash: false });
}

// If nobody has touched the softkeys after a few seconds, nudge the first one.
window.setTimeout(() => {
  if (touched) return;
  const b = boardFor(cur);
  const row = b?.softkeys[0]?.closest('.softkeys');
  if (row && b && b.stage < 0) replay(row, 'hint', 3400);
}, 2600);
