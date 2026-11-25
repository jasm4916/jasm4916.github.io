"""Compose outline + top copper + drills (gerber-to-svg output) into one themed, animatable SVG.
Usage: python3 theme_layout.py <layer-svg-dir> <out.svg> [aria-label]
- Traces become stroke-only <path class="trace" pathLength="1">, one per segment run, so they can draw in.
- Pads/pours become a single muted group; drills punch through; everything uses currentColor.
"""
import re, sys, pathlib

src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
label = sys.argv[3] if len(sys.argv) > 3 else 'Board top copper layout'

def load(name):
    t = (src / name).read_text()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', t).group(1).split()]
    body = t[t.index('>', t.index('<svg')) + 1: t.rindex('</svg>')]
    return t, vb, body

_, ovb, obody = load('layer-all-outline.svg')
ctext, cvb, cbody = load('layer-top-copper.svg')
_, dvb, dbody = load('layer-all-drill.svg')

# Pull trace paths out of the copper body and split each into its own subpaths.
traces = []
def grab(m):
    d, w = m.group(1), m.group(2)
    for sub in re.findall(r'M[^M]+', d):
        traces.append((sub.strip(), w))
    return ''
pads_body = re.sub(r'<path d="([^"]+)" fill="none" stroke-width="([0-9.]+)"/>', grab, cbody)

def nested(vb, inner, cls):
    x, y = vb[0] - ovb[0], vb[1] - ovb[1]
    return (f'<svg class="{cls}" x="{x:.3f}" y="{y:.3f}" width="{vb[2]:.3f}" height="{vb[3]:.3f}" '
            f'viewBox="{" ".join(f"{v:.3f}" for v in vb)} " overflow="visible">{inner}</svg>')

# gerber-to-svg wraps content in <g transform="translate(0,..) scale(1,-1)">; reuse its wrapper for traces.
wrap_open = re.search(r'<g transform="[^"]+"[^>]*>', cbody)
wrap = wrap_open.group(0) if wrap_open else '<g>'
# sort traces so long runs draw first; stagger via CSS custom property
traces.sort(key=lambda t: -len(t[0]))
trace_markup = ''.join(
    f'<path class="trace" pathLength="1" style="--i:{i}" d="{d}" stroke-width="{w}"/>' for i, (d, w) in enumerate(traces)
)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {ovb[2]:.3f} {ovb[3]:.3f}" role="img" aria-label="{label}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
<style>
.pads *{{fill:currentColor;stroke:none}} .pads{{opacity:.35}}
.drills *{{fill:var(--board-bg,#08090a);stroke:none}}
.outline *{{stroke:currentColor;stroke-width:350;fill:none}}
.trace{{fill:none;stroke:currentColor;opacity:.9}}
</style>
{nested(ovb, obody, "outline")}
{nested(cvb, pads_body, "pads")}
{nested(cvb, wrap + trace_markup + '</g>', "traces")}
{nested(dvb, dbody, "drills")}
</svg>'''
out.write_text(svg)
print(f'{len(traces)} trace runs, {len(svg)//1024} KB -> {out}')
