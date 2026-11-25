---
# Board 2 — written from boards/board-2/report/. Paths are relative to src/assets/boards/board-2/; paths starting with / live in public/.
# Gerbers still to come: run `npm run boards 2`, then set layout_placeholder: false and add photo_fallback / links.gerbers.
ch: 2
slug: board-2
title: Good Layout vs. Bad Layout
short: GOOD vs BAD LAYOUT
kind: 2-LAYER · SWITCHING NOISE · SN74AHC14 HEX INVERTERS
color: "#4fd1e8"
wave: goodbad
legend: ■ BAD  ■ GOOD
readout: SAME CIRCUIT, TWO LAYOUTS · YELLOW = BAD · GREEN = GOOD
layers: 2
size: ""
tool: Altium · JLCPCB
assembly: Hand-soldered, 1206 parts
summary: >-
  Two identical SN74AHC14 hex-inverter circuits on one board, driven by the same 555 clock from the
  same 3.3 V rail. The good copy sits over a solid ground plane with its decoupling capacitor right at
  Vcc. The bad copy returns ground through a trace and has its capacitor far away. Same parts, same
  placement, same loads, so the difference on the scope comes from layout alone: ground bounce was 2.8×
  worse on the bad side, and quiet-high noise 2.2× worse.
target: Bad region measurably noisier than good
measured: 2.8× (quiet low) · 2.2× (quiet high)
stats:
  - { label: "Quiet low", value: "289 vs 796 mV", note: "good vs bad pk-pk · 2.8×" }
  - { label: "Quiet high", value: "330 vs 716 mV", note: "good vs bad pk-pk · 2.2×" }
  - { label: "Edge overshoot", value: "3.70 vs 4.27 V", note: "good vs bad, on a 3.3 V rail" }
  - { label: "5 V / 3.3 V", value: "5.09 / 3.32 V" }
  - { label: "Edge rise time", value: "2.95 / 3.11 ns", note: "good / bad, ≈ 115 MHz content" }
  - { label: "555 clock", value: "505.8 Hz", note: "65.7% duty" }
layout_placeholder: true
layout_image: media/fig04-layout.png
layout_caption: "LAYOUT · good region (left) over the GND plane, bad region (right) with no plane"
photo: media/fig05-bare-board.jpg
photo_alt: Board 2 as received from JLCPCB, with the good region and bad region labeled on the silkscreen
photo_caption: AS RECEIVED · bare board from JLCPCB
links:
  report: /downloads/board-2-report.pdf
  schematic: media/fig03-schematic-inverters.png
  model3d: null
---

## PLAN — Plan of record
The goal was to see how much the layout alone affects switching noise. When outputs switch, the current through the chip's power and ground paths changes very fast, and the inductance of those paths turns that into noise.

Power comes in at 5 V on a barrel jack, with an indicator LED. An AMS1117 drops it to 3.3 V, with a filter capacitor and its own LED. The 3.3 V rail feeds the 555 directly, and each hex inverter through its own on/off jumper (JP3 good, JP4 bad). The 555 clock goes to both inverters, and JP2 picks which one is driven.

| Ref | Part | Purpose |
|---|---|---|
| U1 | AMS1117 | 5 V → 3.3 V LDO |
| U2 | TL555G | 500 Hz astable clock |
| U3, U4 | SN74AHC14DR | Schmitt-trigger hex inverters (good & bad) |
| D3–D8, R7–R12 | Red LED + 47 Ω | Switching load on 3 outputs per inverter |
| C5, C6 | 0.1 µF | Decoupling for U3 (close) and U4 (far) |

**It counts as working if:**

| Check | Expected | Result |
|---|---|---|
| 5 V rail (TP1) | Near 5 V, D1 on | 5.09 V |
| 3.3 V rail (TP2) | Near 3.3 V, D2 on | 3.32 V |
| 555 clock (TP3) | 500 Hz, 50% duty | 505.8 Hz, 65.7% |
| Inverter output | Clock, inverted | 509.1 Hz |
| Layout comparison | Bad noisier than good | **2.2–2.8× more** |

**Power budget:** each LED load pulls about (3.3 − 1.9) V / 47 Ω ≈ 30 mA, a little less once the inverter's output resistance counts. Only one region is driven at a time, so the total from 5 V is about 100 mA, far under the AMS1117's 1 A rating. The LDO burns about (5 − 3.3) V × 0.1 A ≈ 0.17 W, which the SOT-223 package handles easily.

lead: Two identical hex-inverter circuits share one clock and one 3.3 V rail. The only differences are the ground return and where the decoupling cap sits, so any difference on the scope comes from layout.
keys:
  - { label: "Clock", value: "555 @ 500 Hz" }
  - { label: "Rail", value: "AMS1117 → 3.3 V" }
  - { label: "Load", value: "3 × LED + 47 Ω per side" }
media: media/fig01-block-diagram.jpg
caption: My block diagram for Board 2

## SCHEMATIC — Parts & schematic
**Power and clock.** D1 indicates 5 V, and C1 (10 µF) sits ahead of the AMS1117. The LDO's filter capacitor C2 is behind JP1, so I can look at the bare LDO output on TP2 and then switch the capacitor in. The 555 runs as a standard astable with R3, R4 and C3, decoupled by C4. Its output goes to TP3 and the middle pin of JP2, which routes the clock to CLK_GOOD or CLK_BAD. Each clock line has a 10 kΩ pull-up to 3.3 V, so the unselected region's inputs sit high and its outputs low instead of floating.

**The two inverter circuits are exact copies.** In each one:
- inputs 1A–3A take the clock, and outputs 1Y–3Y each drive a red LED + 47 Ω: the switching current
- 4A takes the clock too, and 4Y goes unloaded to a test point (TP6 good, TP10 bad) as the scope trigger
- 5A is tied to Vcc, so **5Y is the quiet low** (TP5 good, TP9 bad)
- 6A is tied to GND, so **6Y is the quiet high** (TP4 good, TP8 bad)
- TP7 (good) and TP11 (bad) sit on one LED load
- JP3 and JP4 feed 3.3 V to each chip, with C5 and C6 on the chip side of the jumper

lead: Each inverter has three outputs switching LED loads, one unloaded trigger output, a quiet high and a quiet low. A jumper steers the clock to either side, and 10 kΩ pull-ups keep the idle side from floating.
keys:
  - { label: "Inverters", value: "SN74AHC14" }
  - { label: "Quiet high / low", value: "TP4/TP5 good · TP8/TP9 bad" }
  - { label: "Clock select", value: "JP2" }
media: media/fig03-schematic-inverters.png
caption: Bad (top) and good (bottom) hex-inverter circuits
media2: media/fig02-schematic-power-clock.png
caption2: 5 V input, AMS1117, 555 clock and the JP2 clock selector

## LAYOUT — Layout
Two layers. The bottom is a ground pour over the whole board except a cutout under the bad region. Part placement is identical on both sides; the only intentional differences are the ground return and where the decoupling capacitor sits.

| | Good region (U3) | Bad region (U4) |
|---|---|---|
| Return path | Solid GND plane | No plane: ground through a trace |
| Decoupling cap | C5, next to the Vcc pin | C6, placed far away |
| Test points | TP4–TP7 | TP8–TP11 |

lead: Identical placement on both halves. The good side sits on a solid ground plane with its cap at Vcc; the bad side sits in a cutout with ground through a trace and its cap far away.
keys:
  - { label: "Good", value: "solid plane, C5 at Vcc" }
  - { label: "Bad", value: "trace ground, C6 far away" }
media: media/fig04-layout.png
caption: Good region (left) over the GND plane; bad region (right) in the cutout with no plane

## REVIEW & FAB — Review & fabrication
- **Sept 19:** napkin sketch of the schematic
- **Sept 21:** TA review of the schematic
- **Sept 24:** design files submitted to JLCPCB
- **Oct 8–16:** assembly
- **Oct 20–23:** scope measurements

The boards arrived with no visible shorts or opens, and continuity checks across the board passed.

During assembly I made one change from the schematic: I fitted **R4 as 1 kΩ instead of 10 kΩ**, so R1–R4 all used the same value. That moved the 555's duty cycle from about 50% to about 67%, which shows up in the measurements. Making an undocumented change was a mistake I won't repeat.

Two silkscreen labels didn't fully print: TP3's label sat outside the board outline, and TP11's was partly cut off.

lead: TA review on Sept 21, files submitted Sept 24, and the boards arrived with no shorts or opens. During assembly I fitted R4 as 1 kΩ instead of 10 kΩ, which pushed the clock's duty cycle to about 67%.
keys:
  - { label: "Shorts / opens", value: "none" }
  - { label: "Assembly change", value: "R4: 10 kΩ → 1 kΩ" }
media: media/fig05-bare-board.jpg
caption: Board 2 as received from JLCPCB

## BRING-UP — Bring-up
All measurements used 10x probes on the board's own test points, each with ground pins right beside the signal pin.

**Rails:** 5.09 V and 3.32 V, with both indicator LEDs on.

**555 clock (TP3):** 505.8 Hz, 65.7% duty, 3.40 V high. The frequency is right at the 500 Hz target. The duty cycle is explained by the R4 swap: with R3 = R4 = 1 kΩ it should be 2 kΩ / 3 kΩ = 66.7%, which matches. With the designed 10 kΩ it would have been about 52%.

**Trigger outputs (TP6 / TP10):** both edges rise in about 3 ns (2.95 ns good, 3.11 ns bad), but the overshoot is very different. The good output peaks at **3.70 V**, about 0.4 V over the rail. The bad output peaks at **4.27 V**, nearly 1 V over, before ringing down. A 3 ns edge carries content up to about 115 MHz, so even a few nH of extra inductance shows up on the scope.

lead: Both rails and the clock came up as expected. The trigger edges rise equally fast on both sides, but the bad side overshoots nearly 1 V past the rail. Flip between REF A and REF B on the scope to compare.
keys:
  - { label: "Rails", value: "5.09 / 3.32 V" }
  - { label: "Clock", value: "505.8 Hz · 65.7%" }
  - { label: "Overshoot", value: "3.70 vs 4.27 V" }
media: compare
compare_a: media/fig07-scope-good-trigger-edge.png
compare_a_label: "Good TP6: 3.70 V peak"
compare_b: media/fig08-scope-bad-trigger-edge.png
compare_b_label: "Bad TP10: 4.27 V peak"
sim_a: b2-edge-good
sim_b: b2-edge-bad
verdict: Same ~3 ns edge on both; without the plane it overshoots 0.57 V more
caption: Unloaded trigger output on each region, both redrawn at 1.40 V/div so the heights compare
media2: media/fig06-scope-555.png
caption2: 555 output at TP3: 505.8 Hz, 65.7% duty, 3.40 V high

## RESULTS — Results
**Switching noise, good vs. bad:**

| Quiet output | Good | Bad | Bad / good |
|---|---|---|---|
| Quiet high (TP4 / TP8) | 330 mV | 716 mV | **2.2×** |
| Quiet low (TP5 / TP9) | 289 mV | 796 mV | **2.8×** |

The quiet low shows the biggest difference. Right after the edge, the bad region's ground bounces up about 580 mV for a few ns, then swings about 220 mV below ground. The good region's quiet low peaks at about 160 mV. On the quiet high, the good region's first spike is just under 200 mV and rings down within 40 ns; the bad region's first spike is around 450 mV, and its ringing is still about 200 mV after 40 ns.

**Why the bad region is noisier.** The quiet low sits at the inverter's internal ground, so it shows how far the chip's ground moves relative to the board ground where the probe is clipped. When three outputs switch at once, the LED current returns through the chip's ground pin, and any inductance in that path turns the changing current into a voltage. In the good region the return current flows in the plane directly under the traces, which keeps the loop small. In the bad region it has to follow a ground trace that wanders across the board, a much larger loop. The quiet high works the same way on the Vcc side: with C6 far from the chip, the charge for each edge comes through a long trace instead of from a capacitor a few millimeters away.

**The board rail hides the problem.** Noise on the 3.3 V rail itself was buried in the scope's 113 mV noise floor, while the good region's quiet high measured 330 mV. Both are the same net; the difference is the inductance between the board and the inside of the chip. Measuring only the rail would make the supply look at least three times cleaner than what the chip actually sees.

**What worked:** the comparison itself, since same parts and placement mean the 2.2–2.8× difference comes from the plane and the capacitor position; rails on spec; JP2 moving the clock between regions with nothing else changed; and test points with ground beside every signal, which made every measurement repeatable.

**What I'd do differently:**
- Build R4 as designed (10 kΩ) for a 50% duty cycle, and never change a part without documenting it.
- Capture good and bad back to back with the same setup, overlaid on one screen in the class colors.
- Trigger the single-channel noise captures from the trigger output on a second channel, not on the noise itself. The peak-to-peak comparison is still fair, but the timing isn't shown.
- Check that all silkscreen fits inside the outline before ordering.

*Limitation:* some of the regular ringing in the good-region captures likely comes from the probe and test points. Both regions were measured the same way, so the comparison holds, but the absolute numbers read a little high.

lead: Same chip, same loads, same placement: removing the plane and moving the cap made ground bounce 2.8× worse and quiet-high noise 2.2× worse. Flip between REF A and REF B on the scope to compare.
keys:
  - { label: "Quiet low", value: "289 vs 796 mV · 2.8×" }
  - { label: "Quiet high", value: "330 vs 716 mV · 2.2×" }
media: compare
compare_a: media/fig11-scope-good-quiet-low.png
compare_a_label: "Good quiet low: 289 mV"
compare_b: media/fig12-scope-bad-quiet-low.png
compare_b_label: "Bad quiet low: 796 mV"
sim_a: b2-ql-good
sim_b: b2-ql-bad
verdict: 289 mV vs 796 mV: 2.8× more ground bounce without the ground plane
caption: Quiet low (ground bounce) on each region, same probe and scope settings
gallery:
  - { src: media/fig09-scope-good-quiet-high.png, caption: "Good quiet high (TP4): 330 mV pk-pk" }
  - { src: media/fig10-scope-bad-quiet-high.png, caption: "Bad quiet high (TP8): 716 mV pk-pk" }
