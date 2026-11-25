---
# Board 1 — written from boards/board-1/report/. Paths are relative to src/assets/boards/board-1/; paths starting with / live in public/.
# Gerbers still to come: run `npm run boards 1`, then set layout_placeholder: false and add photo_fallback / links.gerbers.
ch: 1
slug: board-1
title: The 555 LED Driver
short: 555 LED DRIVER
kind: 2-LAYER · NE555 ASTABLE · 1206 HAND ASSEMBLY
color: "#f5d547"
wave: duty67
legend: TRIG ↑
readout: NE555 ASTABLE · DESIGNED 480 Hz / 66.7% · MEASURED 506.5 Hz / 66.0%
layers: 2
size: 88.9 × 50.8 mm (3.5 × 2.0 in)
tool: Altium · JLCPCB
assembly: Hand-soldered, 1206 parts
summary: >-
  My first time through the whole board flow: plan of record, schematic, layout, JLCPCB fabrication,
  hand assembly, then bring-up and test. An NE555 astable switches four red LEDs at about 500 Hz, each
  through a different series resistor (10 kΩ down to 47 Ω), so the board shows how series resistance
  sets LED current and brightness. It powered up on the first try and met every check in my plan of record.
target: 480 Hz · 66.7% duty · rail noise under 250 mV
measured: 506.5 Hz · 66.0% duty · 72 mV
stats:
  - { label: "Frequency", value: "506.5 Hz", note: "designed 480 Hz (+5.5%)" }
  - { label: "Duty cycle", value: "66.0%", note: "designed 66.7%" }
  - { label: "5 V rail", value: "5.12 V", note: "72 mV pk-pk switching noise" }
  - { label: "LED load", value: "49.3 mA", note: "all four LEDs on" }
  - { label: "555 output R", value: "≈ 18 Ω", note: "4.62 V → 3.74 V under load" }
  - { label: "Rise time", value: "89.4 ns", note: "datasheet ≈ 100 ns" }
layout_placeholder: true
layout_image: media/fig04-layout.png
photo: media/fig07-powered-leds-on.jpg
photo_alt: Board 1 powered from a barrel jack with the power LED and four red LEDs lit at four different brightness levels
photo_caption: POWERED · four LEDs, four brightness levels (10 kΩ → 47 Ω)
links:
  report: /downloads/board-1-report.pdf
  schematic: media/fig03-schematic.png
  model3d: null
---

## PLAN — Plan of record
A NE555 timer switches four red LEDs on and off at 480 Hz, too fast for the eye to see as blinking. Each LED has a different series resistor, so the board shows how LED brightness tracks current. Power is 5 V from a wall adapter through a barrel jack.

| Block | Parts | Purpose |
|---|---|---|
| Power in | Barrel jack, C1 22 µF, D1, R1 1 kΩ | Take the 5 V, show when it's on |
| Oscillator | NE555, R2 1 kΩ, R3 1 kΩ, C3 1 µF | 480 Hz, 67% duty |
| LEDs | D2–D5, R4–R7 | Four brightness levels |
| Test points | TP1, TP2, TP3 | 5 V rail, 555 OUT, across 1 kΩ |
| Jumpers | SW1, SW2 | Remove 555 power, disconnect LEDs |

**Why the NE555:** the LED bank pulls around 50 mA, well under the NE555's 200 mA output rating. In my Lab 2 experiment with a 50 Ω LED load, the NE555 held 4.4 V while the TLC555 sagged to 3.2 V, so I picked it from measurement rather than from the datasheet alone.

**It counts as working if:**
- the 5 V rail is within 5% and the power LED is on
- the 555 output is a square wave near 480 Hz and 67% duty
- all four LEDs light, getting brighter as the resistor values get smaller
- switching noise on the 5 V rail stays under 250 mV
- LED current can be read at TP3 with a probe

lead: An NE555 blinks four red LEDs at 480 Hz, each through a different resistor, to show how series resistance sets current and brightness. I chose the NE555 from my own Lab 2 measurements: it held 4.4 V under a 50 Ω load where the TLC555 sagged to 3.2 V.
keys:
  - { label: "Design", value: "480 Hz · 67% duty" }
  - { label: "Rail-noise limit", value: "under 250 mV" }
  - { label: "LED resistors", value: "10 kΩ · 1 kΩ · 300 Ω · 50 Ω" }
media: media/fig01-hand-sketch.jpg
caption: My hand sketch of the circuit, with the timing math
media2: media/fig02-breadboard-lab2.jpg
caption2: The Lab 2 breadboard version, running

## SCHEMATIC — Parts & schematic
The timing uses R2 = R3 = 1 kΩ and C3 = 1 µF:

- **f** = 1.44 / ((R2 + 2·R3)·C3) = 1.44 / (3 kΩ · 1 µF) = **480 Hz**
- **D** = (R2 + R3) / (R2 + 2·R3) = 2/3 ≈ **67%**

Both sit inside the Lab 2 limits of 300–1000 Hz and 40–75% duty. To turn the breadboard circuit into a board, I added:

- a barrel jack with a test point, a 22 µF capacitor and a power LED on the input
- **SW1** between the input and the 555's power pins
- **TP2** on the 555 output before SW2, so the output can be probed with or without the LEDs connected
- each LED sitting *above* its resistor, so TP3 reads the 1 kΩ resistor's voltage to ground

All parts came from the class library: NE555, 1206 resistors, capacitors and LEDs, 4-hole test points and 2-pin headers for the switches. The LED resistors are R4 10 kΩ, R5 1 kΩ, R6 300 Ω and R7 50 Ω.

lead: R2 = R3 = 1 kΩ and C3 = 1 µF set 480 Hz at 67% duty. Beyond the breadboard version I added a power LED, a jumper to cut the 555's power, a test point ahead of the LED jumper, and each LED above its resistor so one probe reads the current.
keys:
  - { label: "Frequency", value: "1.44 / (3 kΩ · 1 µF) = 480 Hz" }
  - { label: "Duty", value: "2/3 ≈ 67%" }
  - { label: "Parts", value: "class library, 1206" }
media: media/fig03-schematic.png
caption: Altium schematic

## LAYOUT — Layout
A 2-layer board, 3.5 × 2.0 in. The entire bottom layer is a ground plane, and every test point has its three ground holes tied to it, so the probe ground has the shortest possible path. The silkscreen carries my name, the board name and date, and labels for the test points and jumpers.

lead: A 3.5 × 2.0 in, 2-layer board with the whole bottom layer as ground. Every test point's three ground holes tie straight into the plane, so the probe's ground path is as short as possible.
keys:
  - { label: "Size", value: "3.5 × 2.0 in" }
  - { label: "Layers", value: "2, bottom = GND plane" }
  - { label: "Test points", value: "3 × 4-pin" }
media: media/fig04-layout.png
caption: Board layout in Altium

## REVIEW & FAB — Review & fabrication
A classmate did the peer review, and a TA checked it off as well.

When I submitted the design files, I didn't run the JLCPCB DFM check correctly: I submitted a screenshot of the board preview instead of the actual approval page. I ran the DFM check properly while rewriting the report, and it came back approved. The lesson stuck: a skipped DFM check means problems only show up at testing.

lead: A classmate and a TA reviewed the design. My first DFM submission was a preview screenshot rather than JLCPCB's actual check; I ran it properly when rewriting the report and it passed.
keys:
  - { label: "Review", value: "classmate + TA" }
  - { label: "DFM", value: "approved on re-check" }
media: media/fig05-bare-board.jpg
caption: Board as received from JLCPCB

## BRING-UP — Bring-up
I hand-soldered all the 1206 parts and brought the board up in sections using the jumpers:

1. **Both jumpers open:** checked the 5 V rail and the power LED. TP1 read **5.12 V** and the LED came on. The board powered up on the first try.
2. **SW1 closed:** the 555 output on its own at TP2.
3. **SW1 and SW2 closed:** LEDs connected.

**555 output, unloaded (TP2):**

| Measurement | Designed | Measured |
|---|---|---|
| Frequency | 480 Hz | **506.5 Hz** |
| Duty cycle | 66.7% | **66.0%** |
| High level | 5 V | **4.62 V** |
| Rise time | ≈ 100 ns | **89.4 ns** |

The frequency is 5.5% above design but inside the 432–533 Hz range, and the duty cycle is within 1%. The high level sits about 0.5 V under the rail, which is normal for the NE555 output stage. On the rising edge the output overshoots to about 5.1 V, dips, and settles near 4.6 V within 1 µs.

lead: It powered up on the first try. I brought it up one jumper at a time: the rail first, then the 555 on its own, then the LEDs.
keys:
  - { label: "5 V rail", value: "5.12 V" }
  - { label: "Frequency", value: "506.5 Hz (+5.5%)" }
  - { label: "Duty", value: "66.0%" }
media: media/fig06-assembled.jpg
caption: Assembled board, unplugged
media2: media/fig09-scope-rising-edge.png
caption2: Rising edge at TP2: 89.4 ns, overshoot to ≈ 5.1 V

## RESULTS — Results
**Loading the 555.** Connecting the LEDs pulls the output high level from 4.62 V down to 3.74 V, a 19% drop, with no visible change in frequency or duty cycle. That gives the 555's output resistance:

R_th = (V_open − V_loaded) / I_load = (4.62 − 3.74) / 0.0493 ≈ **18 Ω**

**Current in every LED.** TP3 reads 1.84 V while the output is high, so the LED forward voltage is 3.74 − 1.84 = 1.90 V. That leaves 1.84 V across each LED resistor. D1 runs off the 5 V rail, so its resistor sees 5.12 − 1.90 = 3.22 V.

| LED | Resistor | Current |
|---|---|---|
| D1 (power) | 1 kΩ | 3.2 mA |
| D2 | 10 kΩ | 0.18 mA |
| D3 | 1 kΩ | 1.84 mA |
| D4 | 300 Ω | 6.1 mA |
| D5 | 47 Ω | 41.2 mA |
| **D2–D5 total** | | **49.3 mA** |

D2 at 0.18 mA is dim but clearly on, and D3 at 1.84 mA is easy to see. For an indicator, 1–3 mA is plenty; going higher costs current for brightness nobody needs. D5 alone draws about 84% of the 555's output current.

**Rail noise.** The 5 V rail shows **72 mV** peak-to-peak, 1.4% of the rail and well under the 250 mV limit. The sawtooth comes from the LED load: when the output goes high the LEDs start drawing about 49 mA and the rail steps down, then drifts back up when the output goes low.

**What I'd change next time:**

| Issue | Effect | Next time |
|---|---|---|
| No cap on NE555 pin 5 | Unknown, likely supply noise | Add the datasheet's 10 nF |
| TP3 not labeled | Nobody else would know what it measures | Label every test point by what it measures |
| DFM check not done properly | Problems would surface only at test | Always run the real JLCPCB check |
| R7 fitted as 47 Ω, not 50 Ω | D5 draws ~12% more than designed | Build to the design, or update the BOM |
| Scope setup slips | One capture taken before the trigger was set | Set the trigger and fit the waveform first |

**What I'd keep:** choosing the 555 from my own Lab 2 measurements, wiring the LEDs above their resistors so one probe point gave me the forward voltage and all four currents, and the jumpers that let me test the board in sections. Most of what you can learn and fix on a board is decided before layout.

lead: Connecting the LEDs pulled the 555's output from 4.62 V to 3.74 V, which puts its output resistance near 18 Ω. Rail noise stayed at 72 mV, well under the 250 mV limit. Flip between REF A and REF B on the scope to compare.
keys:
  - { label: "LED load", value: "49.3 mA" }
  - { label: "Output resistance", value: "≈ 18 Ω" }
  - { label: "Rail noise", value: "72 mV pk-pk" }
media: compare
compare_a: media/fig08-scope-555-unloaded.png
compare_a_label: "LEDs off (SW2 open): 4.62 V"
compare_b: media/fig10-scope-555-loaded.png
compare_b_label: "LEDs on (SW2 closed): 3.74 V"
sim_a: b1-unloaded
sim_b: b1-loaded
verdict: Same timing, 0.88 V lower high level: the 555 has about 18 Ω of output resistance
caption: 555 output at TP2, without and with the LED load. Same frequency and duty, 19% lower high level
gallery:
  - { src: media/fig11-scope-tp3-r5.png, caption: "TP3 across R5 (1 kΩ): 1.84 V, so D3 carries 1.84 mA" }
  - { src: media/fig12-scope-rail-ac.png, caption: "5 V rail, AC-coupled (yellow), 555 output as trigger (green): 72 mV pk-pk" }
  - { src: media/fig13-scope-rail-edge.png, caption: "Same rail zoomed on one rising edge" }
