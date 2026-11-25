# Jacob Smith · PCB portfolio

An oscilloscope-themed portfolio. The home page is the instrument: four ECEN 3730 boards as design-process case studies. `/projects/` has the capstone touchscreen demo and the vehicle; `/about/` has an animated scene for each role.
It's a static Astro site with self-hosted fonts and no external services, about 5 KB of JavaScript, and it reads fine with JS off.
It's hosted on GitHub Pages at **https://jasm4916.github.io/**.

```bash
npm install
```

```bash
npm run dev       # http://localhost:4321
```

```bash
npm run build     # static site in dist/
```

```bash
npm run boards    # regenerate board layouts from Gerber zips
```

## Where things live

| Path | What it is |
|---|---|
| `src/content/boards/board-N.md` | Each board: frontmatter (specs, stats, summary, links) and six `## STAGE — Title` sections |
| `src/content/projects/*.md` | Projects page entries (capstone, vehicle): `demo`, `role`, `facts`; the body is the write-up |
| `src/content/pages/home.md` | Name, tagline, course credit, contact label, footer |
| `src/content/pages/about.md`, `projects.md` | Each page's header (eyebrow, title, intro) and the About page's "On the bench" skills |
| `src/content/experience/*.md` | One file per role on the About page: org, role, dates, colour, which animated scene to show, lead sentence, bullets |
| `src/lib/captures.ts`, `src/components/SimScope.astro` | The redrawn scope captures shown on the boards instrument: timebase, scales, Meas readouts, waveform shapes and the callout text. A comparison stage uses them via `sim_a`, `sim_b` and `verdict`; the original screenshots stay linked as "original A · B" |
| `src/components/scenes/` | The animated line-art scenes (relay trip, TBM cutter head, Hyperloop, FPGA clock divider, vehicle) |
| `src/components/AmpDemo.astro`, `src/lib/amp-ui.ts` | The capstone touchscreen demo; effects, colours and knob defaults come from the team's firmware |
| `src/site.config.ts` | Email, LinkedIn URL (`''` hides the button), résumé path, which board shows first |
| `src/assets/boards/board-N/` | Images and SVGs the site renders (`media/…`, `svg/…`) |
| `public/downloads/` | Résumé, report PDFs, Gerber zips (served as-is) |
| `boards/board-N/` | Source material: report PDF, Gerber zip, generated SVG layers |
| `tools/`, `scripts/boards.mjs` | Gerber → SVG pipeline |

Anything written in `[square brackets]` anywhere in the content shows on the site as a highlighted placeholder, so unfinished bits are obvious.

## Add a board from its report + Gerbers

1. Put the files in place:
   - `boards/board-N/report/<report>.pdf`
   - `boards/board-N/gerbers/<gerbers>.zip`
2. Generate the layout art: `npm run boards N` (or just `npm run boards` for all). This writes:
   - `src/assets/boards/board-N/svg/board-N-layout.svg`, the line-art that draws in trace by trace
   - `src/assets/boards/board-N/svg/stackup-top.svg`, a realistic render
   - `public/downloads/board-N-gerbers.zip`

   It needs `node`, `python3` and `unzip`.
3. Copy the report to `public/downloads/board-N-report.pdf`. Export the figures you want from it (schematic, layout, photos, scope captures) into `src/assets/boards/board-N/media/`.
4. Rewrite `src/content/boards/board-N.md` in the same style as `board-3.md`:
   - first person and concise
   - every number taken from the report
   - set `layout_placeholder: false`, `photo_fallback: svg/stackup-top.svg`, `links.report: /downloads/board-N-report.pdf` and `links.gerbers: /downloads/board-N-gerbers.zip`

   (Or ask Claude Code: *"Add Board N from its report and Gerbers, the same way as Board 3."*)
5. To add a 5th board, create `board-5.md`. The CH key, colours and prev/next wiring are all generated from it.

### Stage format

The scope at the top is the case-study viewer. The CH keys pick a board, and the softkeys under the screen step through its six stages. Each stage's `media` shows on the scope screen; its `lead` and `keys` show in the card below, and the markdown body sits behind **Full notes**. A `compare` stage shows REF A / REF B buttons on the screen.

```markdown
## RESULTS — Results
Markdown body (the "Full notes"): lists, **bold**, tables styled as instrument readouts.

lead: Two or three sentences a skimmer reads. Keep it under ~60 words.
keys:                               # 2–3 numbers shown as readout tiles
  - { label: "Quiet low", value: "0.90 V vs 2.21 V · 41%" }
media: media/fig10-scope.png        # shown on the scope: image | layout_svg | compare | "[Placeholder text]"
caption: What the figure shows      # shown under the scope screen
media2: media/another.png           # optional, shown as a thumbnail
caption2: …
compare_a: media/golden.png         # only for media: compare (the drag slider)
compare_a_label: Golden: 0.90 V
compare_b: media/commercial.png
compare_b_label: Commercial: 2.21 V
gallery:                            # optional thumbnails that open in the lightbox
  - { src: media/x.png, caption: "…" }
```

A board whose report isn't ready can set `status: in-progress` and a `progress_note:`. It then shows only its summary, the goal and that note.

Stage labels become deep-link slugs from their first word: `#board-3/plan`, `/schematic`, `/layout`, `/review`, `/bring-up`, `/results`.

## Swap a photo

Put the photo in `src/assets/boards/board-N/media/`, then set these in the board's frontmatter:
- `photo: media/your-photo.jpg`
- `photo_alt: …`

It's shown in true color. Astro makes AVIF/WebP sizes at build time, so drop in full-resolution JPGs.

If there's no photo yet, `photo_fallback: svg/stackup-top.svg` shows the Gerber render instead.

## Deploy (GitHub Pages, account `jasm4916`)

One-time setup:

1. Log the GitHub CLI into the `jasm4916` account: `gh auth login` (choose that account in the browser).
2. Create the repo and push. A repo named `jasm4916.github.io` serves at the root URL:

   ```bash
   git init -b main && git add -A && git commit -m "Portfolio site"
   ```

   ```bash
   gh repo create jasm4916/jasm4916.github.io --public --source . --push
   ```

3. Turn on Pages: repo **Settings → Pages → Source: GitHub Actions**.

   ```bash
   gh api -X POST repos/jasm4916/jasm4916.github.io/pages -f build_type=workflow
   ```

After that, every push to `main` rebuilds and deploys through `.github/workflows/deploy.yml`. It takes about a minute.

- **Different repo name** (e.g. `portfolio`): set `base: '/portfolio'` in `astro.config.mjs`. The site then lives at `https://jasm4916.github.io/portfolio/`.
- **Custom domain:**
  1. Add `public/CNAME` containing the domain.
  2. Set `site` in `astro.config.mjs` to `https://yourdomain.com`.
  3. Point the domain's DNS at GitHub Pages.

## Other bits

- `node scripts/make-og.mjs` re-renders `public/og.png` (the link-preview image) and the favicon PNGs with headless Chrome. Run it if the name or tagline changes.
- Motion is CSS/SVG only and switches off under `prefers-reduced-motion`.
- `reference/`, `assets/` and `Claude outputs/` are git-ignored so the course material and handover notes stay off the public repo.
