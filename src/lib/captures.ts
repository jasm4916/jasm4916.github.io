// Scope captures redrawn natively for the instrument screen.
//
// Each entry recreates one Keysight capture from the board reports: same timebase, volts/div,
// channel positions and Meas-panel readouts. Trace shapes are synthesized to follow the capture,
// then scaled so the drawn peak-to-peak (or top level) equals the measured value exactly.
// Callout text lives here too; edit it like copy.

/* ---------- geometry (SVG units) ---------- */
export const G = { W: 820, H: 440, X0: 54, X1: 634, Y0: 40, Y1: 400, PX: 644, PW: 168 };
const DIVX = (G.X1 - G.X0) / 10; // 58
const DIVY = (G.Y1 - G.Y0) / 8; // 45

export const CH_COLOR: Record<number, string> = { 1: '#f2e14c', 2: '#6fe39a', 3: '#5aa9ff', 4: '#f06bd0' };

type Fn = (t: number) => number;
type ChDef = { n: number; vdiv: number; zeroDiv: number; scale: string; f: Fn; pkpk?: number; label?: string };
type Callout = { ch: number; t: number; v: number; dx: number; dy: number; title: string; note?: string };
type Span = { ch: number; t1: number; t2: number; v: number; label: string; dy?: number };
type Ref = { ch: number; v: number; label: string; color?: string };
type Def = {
  t0: number; t1: number; tLabel: (t: number) => string; timebase: string; trig: string; axisCh: number;
  axisLabel: (v: number) => string; chans: ChDef[]; readouts: [string, string, number?][];
  callouts: Callout[]; spans?: Span[]; refs?: Ref[];
};

/* ---------- helpers ---------- */
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
// smooth deterministic noise: a few incommensurate sines plus a little hash noise
const noise = (t: number, a: number, seed = 1) =>
  a * (0.45 * Math.sin(t * 0.37 + seed) + 0.3 * Math.sin(t * 1.13 + seed * 2.1) + 0.25 * Math.sin(t * 2.71 + seed * 3.7) + 0.35 * (rnd(Math.round(t * 3) + seed * 999) - 0.5));
const ring = (dt: number, amp: number, period: number, tau: number) => (dt < 0 ? 0 : amp * Math.exp(-dt / tau) * Math.cos((2 * Math.PI * dt) / period));
const gauss = (t: number, c: number, s: number, a: number) => a * Math.exp(-((t - c) ** 2) / (2 * s * s));
const raisedCos = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * x));

/** Scale a waveform about its baseline (value at t0) so its peak-to-peak over [t0, t1] equals pp. */
function fitPkPk(f: Fn, t0: number, t1: number, pp: number): Fn {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= 2000; i++) { const v = f(t0 + ((t1 - t0) * i) / 2000); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  const k = pp / (hi - lo);
  return (t) => f(t) * k;
}

/* ---------- the captures ---------- */
const ns = (t: number) => (t === 0 ? '0.0' : `${t}n`);
const mv = (v: number) => (Math.abs(v) < 1 ? `${Math.round(v * 1000)}m` : v.toFixed(2));

// Board 3: switching noise, golden vs commercial Uno (200 ns/div; CH1 D4, CH2 D3 quiet low, CH3 D2 quiet high)
function b3(golden: boolean): Def {
  const P = golden ? 875.2 : 875.6; // 1/1.1426 MHz, 1/1.1421 MHz
  const rises = [-2, -1, 0, 1, 2].map((k) => k * P);
  const falls = rises.map((r) => r + P / 2);
  const ch1: Fn = (t) => {
    const ph = ((t % P) + P) % P;
    let v = ph < P / 2 ? 5 : 0;
    for (const r of rises) v += ring(t - r, golden ? 1.4 : 1.0, 26, 22);
    for (const fl of falls) v += ring(t - fl, golden ? -1.4 : -1.0, 26, 22);
    return v;
  };
  const quiet = (seed: number, rise: number, fall: number, period: number, tau: number, fuzz: number, texture: number): Fn => (t) => {
    let v = noise(t, fuzz, seed) + texture * Math.sin(t / 11 + seed) * (0.6 + 0.4 * Math.sin(t / 53));
    for (const r of rises) v += ring(t - r, rise, period, tau);
    for (const fl of falls) v += ring(t - fl, fall, period, tau);
    return v;
  };
  const g = golden;
  const c2 = fitPkPk(quiet(3, g ? 0.55 : -1.0, g ? -0.35 : 0.55, g ? 24 : 40, g ? 18 : 55, g ? 0.06 : 0.12, g ? 0 : 0.22), -1000, 1000, g ? 0.9 : 2.21);
  const c3 = fitPkPk(quiet(7, g ? -0.45 : -1.05, g ? 0.3 : 0.5, g ? 22 : 38, g ? 16 : 50, g ? 0.12 : 0.14, g ? 0.03 : 0.2), -1000, 1000, g ? 0.82 : 2.17);
  return {
    t0: -1000, t1: 1000, tLabel: (t) => (t === 0 ? '0.0' : `${t}n`), timebase: '200 ns/', trig: "Trig'd ↑ 2.50V", axisCh: 2,
    axisLabel: (v) => (v === 0 ? '0.0' : mv(v)),
    chans: [
      { n: 1, vdiv: 2, zeroDiv: 3.26, scale: '2.00V/', f: ch1, label: 'D4' },
      { n: 2, vdiv: 0.5, zeroDiv: 4.38, scale: '500mV/', f: c2, label: 'D3' },
      { n: 3, vdiv: 0.5, zeroDiv: 4.98, scale: '500mV/', f: c3, label: 'D2' },
    ],
    readouts: g
      ? [['Freq(1)', '1.1426MHz', 1], ['Pk-Pk(1)', '7.8V', 1], ['Pk-Pk(2)', '900mV', 2], ['Pk-Pk(3)', '820mV', 3]]
      : [['Freq(1)', '1.1421MHz', 1], ['Pk-Pk(1)', '7.0V', 1], ['Pk-Pk(2)', '2.21V', 2], ['Pk-Pk(3)', '2.17V', 3]],
    callouts: g
      ? [
          { ch: 1, t: 0, v: 5.6, dx: 40, dy: -2, title: 'CH1 · D4–D7 switch', note: 'all four pins at once' },
          { ch: 2, t: 4, v: 0.45, dx: 150, dy: 92, title: 'CH2 quiet low 0.90 V pk-pk', note: 'held low, but it still bounces' },
          { ch: 3, t: -430, v: -0.3, dx: -150, dy: 92, title: 'CH3 quiet high 0.82 V pk-pk', note: 'held high, same story' },
        ]
      : [
          { ch: 2, t: 2, v: 0.75, dx: 150, dy: 70, title: 'CH2 quiet low 2.21 V pk-pk', note: '2.5× the golden board' },
          { ch: 3, t: -873, v: -1.05, dx: 20, dy: 50, title: 'CH3 quiet high 2.17 V pk-pk', note: 'same sketch, probes, settings' },
        ],
  };
}

// Board 1: 555 output at TP2, LEDs disconnected vs connected (500 µs/div)
function b1(loaded: boolean): Def {
  const P = loaded ? 1.9453 : 1.9744; // ms: 1/514.05 Hz, 1/506.49 Hz
  const duty = loaded ? 0.66032 : 0.65999;
  const top = loaded ? 3.74 : 4.62;
  const f: Fn = (t) => { const ph = ((t % P) + P) % P; return ph < duty * P ? top : 0; };
  return {
    t0: -2.5, t1: 2.5, tLabel: (t) => (t === 0 ? '0.0' : `${t.toFixed(2)}m`), timebase: '500 µs/', trig: loaded ? 'Auto ↑ 2.50V' : 'Auto ↑ 0.0V', axisCh: 1,
    axisLabel: (v) => v.toFixed(2),
    chans: [{ n: 1, vdiv: 2, zeroDiv: 4, scale: '2.00V/', f, label: 'TP2' }],
    readouts: loaded
      ? [['Freq(1)', '514.05Hz', 1], ['Avg - FS(1)', '2.3020V', 1], ['+Duty(1)', '66.032%', 1], ['Top(1)', '3.74V', 1]]
      : [['Freq(1)', '506.49Hz', 1], ['Avg - FS(1)', '3.1620V', 1], ['+Duty(1)', '65.999%', 1], ['Top(1)', '4.62V', 1]],
    refs: loaded ? [{ ch: 1, v: 4.62, label: 'unloaded 4.62 V', color: '#8d939b' }] : [],
    spans: loaded
      ? [{ ch: 1, t1: 0, t2: P, v: -2.4, label: `period ${P.toFixed(2)} ms` }]
      : [{ ch: 1, t1: 0, t2: P, v: -1.3, label: '1.97 ms → 506.5 Hz' }, { ch: 1, t1: 0, t2: duty * P, v: 6.1, label: 'high for 66% of it' }],
    callouts: loaded
      ? [
          { ch: 1, t: 0.6, v: 3.74, dx: 30, dy: 50, title: 'Top 3.74 V with the LEDs on', note: '0.88 V lower: 19% drop' },
          { ch: 1, t: 2.15, v: 4.18, dx: -360, dy: -66, title: '(4.62 − 3.74) / 49.3 mA', note: '≈ 18 Ω output resistance' },
        ]
      : [{ ch: 1, t: 0.6, v: 4.62, dx: 30, dy: 70, title: 'Top 4.62 V', note: '~0.5 V under the 5.12 V rail: normal for the NE555' }],
  };
}

// Board 2: unloaded trigger output, good vs bad region (2 ns/div; both drawn at 1.40 V/div so heights compare)
function b2edge(bad: boolean): Def {
  const vpk = bad ? 4.2663 : 3.7031;
  const start = bad ? -1.3 : -1.2;
  const T = (bad ? 3.1107 : 2.9491) / 0.59; // raised-cosine 10–90% = 0.59 T
  const per = bad ? 11 : 6.8, decay = bad ? 0.21 : 0.085;
  const base = bad ? -0.085 : -0.06;
  const f: Fn = (t) => {
    if (t < start) return base * Math.exp(-((t + 6) ** 2) / 8);
    if (t < start + T) return vpk * raisedCos((t - start) / T);
    const dt = t - start - T;
    return 3.3 + (vpk - 3.3) * Math.exp(-decay * dt) * Math.cos((2 * Math.PI * dt) / (2 * per));
  };
  const t10 = start + T * 0.205, t90 = start + T * 0.795;
  return {
    t0: -10, t1: 10, tLabel: (t) => (t === 0 ? '0.0' : `${t}n`), timebase: '2.00 ns/', trig: 'Stop ↑ 1.50V', axisCh: 1,
    axisLabel: (v) => v.toFixed(2),
    chans: [{ n: 1, vdiv: 1.4, zeroDiv: 4, scale: '1.40V/', f, label: bad ? 'TP10' : 'TP6' }],
    readouts: bad
      ? [['Pk-Pk(1)', '4.3518V', 1], ['Rise(1)', '3.1107ns', 1], ['Max(1)', '4.2663V', 1]]
      : [['Pk-Pk(1)', '3.7638V', 1], ['Rise(1)', '2.9491ns', 1], ['Max(1)', '3.7031V', 1]],
    refs: [{ ch: 1, v: 3.3, label: '3.3 V rail', color: '#8d939b' }],
    spans: [{ ch: 1, t1: t10, t2: t90, v: -0.9, label: `rise ${bad ? '3.11' : '2.95'} ns` }],
    callouts: bad
      ? [{ ch: 1, t: start + T, v: vpk, dx: -250, dy: -14, title: 'Max 4.27 V', note: 'nearly 1 V over the rail' }]
      : [{ ch: 1, t: start + T, v: vpk, dx: -230, dy: -14, title: 'Max 3.70 V', note: '0.4 V over the rail' }],
  };
}

// Board 2: quiet low, good vs bad region (10 ns/div, 200 mV/div)
function b2ql(bad: boolean): Def {
  const raw: Fn = bad
    ? (t) => noise(t, 0.004, 5) + gauss(t, 1.6, 1.5, 0.58) + gauss(t, 6.4, 2.4, -0.23) + gauss(t, 14, 3.8, 0.065) + gauss(t, 22, 3, -0.028) + gauss(t, 30, 3, 0.012)
    : (t) => noise(t, 0.004, 9) + gauss(t, 0.9, 0.9, 0.19) + (t > 1.5 ? -0.1 * Math.exp(-(t - 1.5) / 30) * Math.sin((2 * Math.PI * (t - 1.5)) / 10.5 + 0.35) : 0);
  const f = fitPkPk(raw, -50, 50, bad ? 0.79598 : 0.28945);
  return {
    t0: -50, t1: 50, tLabel: (t) => (t === 0 ? '0.0' : `${t}n`), timebase: '10.0 ns/', trig: 'Stop ↑ 100mV', axisCh: 1,
    axisLabel: (v) => mv(v),
    chans: [{ n: 1, vdiv: 0.2, zeroDiv: 4, scale: '200mV/', f, label: bad ? 'TP9' : 'TP5' }],
    readouts: [['Pk-Pk(1)', bad ? '795.98mV' : '289.45mV', 1]],
    refs: [],
    callouts: bad
      ? [
          { ch: 1, t: 1.6, v: 0.58, dx: 70, dy: 6, title: '+0.58 V ground bounce', note: 'for a few ns after the edge' },
          { ch: 1, t: 6.4, v: -0.22, dx: 60, dy: 52, title: '−0.22 V', note: 'then swings below ground' },
        ]
      : [{ ch: 1, t: 0.9, v: 0.19, dx: 70, dy: -6, title: '289 mV pk-pk', note: 'small, quick ring with the plane' }],
  };
}

const DEFS: Record<string, () => Def> = {
  'b3-golden': () => b3(true),
  'b3-uno': () => b3(false),
  'b1-unloaded': () => b1(false),
  'b1-loaded': () => b1(true),
  'b2-edge-good': () => b2edge(false),
  'b2-edge-bad': () => b2edge(true),
  'b2-ql-good': () => b2ql(false),
  'b2-ql-bad': () => b2ql(true),
};

/* ---------- render model ---------- */
export type Capture = {
  header: { n: number; scale: string; color: string }[];
  timebase: string; trig: string;
  traces: { n: number; color: string; d: string; label?: string; zeroY: number }[];
  vLabels: { y: number; text: string }[];
  tLabels: { x: number; text: string }[];
  readouts: { label: string; value: string; color: string }[];
  refs: { y: number; label: string; color: string }[];
  spans: { x1: number; x2: number; y: number; label: string; color: string }[];
  callouts: { x: number; y: number; lx: number; ly: number; title: string; note?: string; color: string; w: number }[];
};

export function capture(id: string): Capture {
  const make = DEFS[id];
  if (!make) throw new Error(`Unknown capture "${id}"`);
  const d = make();
  const xOf = (t: number) => G.X0 + ((t - d.t0) / (d.t1 - d.t0)) * (G.X1 - G.X0);
  const ch = (n: number) => d.chans.find((c) => c.n === n)!;
  const yOf = (n: number, v: number) => { const c = ch(n); return G.Y0 + c.zeroDiv * DIVY - (v / c.vdiv) * DIVY; };
  const clampY = (y: number) => Math.max(G.Y0 + 1, Math.min(G.Y1 - 1, y));
  const N = 900;
  const traces = d.chans.map((c) => {
    let p = '';
    for (let i = 0; i <= N; i++) {
      const t = d.t0 + ((d.t1 - d.t0) * i) / N;
      p += `${i ? 'L' : 'M'}${xOf(t).toFixed(1)} ${clampY(yOf(c.n, c.f(t))).toFixed(1)}`;
    }
    return { n: c.n, color: CH_COLOR[c.n], d: p, label: c.label, zeroY: G.Y0 + c.zeroDiv * DIVY };
  });
  const axis = ch(d.axisCh);
  // label round voltages of the axis channel where they actually sit (like a scope with an offset)
  const vLabels: { y: number; text: string }[] = [];
  for (let k = -20; k <= 20; k++) {
    const v = k * axis.vdiv;
    const y = yOf(axis.n, v);
    if (y > G.Y0 + 10 && y < G.Y1 - 4) vLabels.push({ y, text: d.axisLabel(Math.round(v * 1000) / 1000) });
  }
  const tLabels = [-4, -2, 0, 2, 4].map((k) => {
    const t = (d.t0 + d.t1) / 2 + (k * (d.t1 - d.t0)) / 10;
    return { x: G.X0 + (5 + k) * DIVX, text: d.tLabel(Math.round(t * 1000) / 1000) };
  });
  const textW = (s: string, px = 12.5) => s.length * px * 0.61 + 20; // JetBrains Mono advance ≈ 0.6 em
  return {
    header: d.chans.map((c) => ({ n: c.n, scale: c.scale, color: CH_COLOR[c.n] })),
    timebase: d.timebase, trig: d.trig,
    traces, vLabels, tLabels,
    readouts: d.readouts.map(([label, value, n]) => ({ label, value, color: CH_COLOR[n ?? 1] })),
    refs: (d.refs ?? []).map((r) => ({ y: yOf(r.ch, r.v), label: r.label, color: r.color ?? CH_COLOR[r.ch] })),
    spans: (d.spans ?? []).map((s) => ({ x1: xOf(s.t1), x2: xOf(s.t2), y: clampY(yOf(s.ch, s.v)), label: s.label, color: CH_COLOR[s.ch] })),
    callouts: d.callouts.map((c) => {
      const x = xOf(c.t), y = clampY(yOf(c.ch, c.v));
      const w = Math.max(textW(c.title), c.note ? textW(c.note, 11.5) : 0);
      let lx = x + c.dx, ly = y + c.dy;
      lx = Math.max(G.X0 + 4, Math.min(G.X1 - w - 4, lx)); // keep the label inside the plot
      ly = Math.max(G.Y0 + 6, Math.min(G.Y1 - (c.note ? 40 : 24), ly));
      return { x, y, lx, ly, title: c.title, note: c.note, color: CH_COLOR[c.ch], w };
    }),
  };
}
