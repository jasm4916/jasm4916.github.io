---
# Board 3 — FINAL. Paths are relative to src/assets/boards/board-3/; paths starting with / live in public/.
ch: 3
slug: board-3
title: The Golden Arduino
short: GOLDEN ARDUINO
kind: 2-LAYER · ATMEGA328P · CH340G USB-UART
color: "#f06bd0"
wave: uart
legend: UART TX
readout: ATMEGA328P @ 16.00 MHz · CH340G @ 11.99 MHz · REV A
layers: 2
size: 76.2 × 76.2 mm (3.0 × 3.0 in)
tool: KiCad 7 · JLCPCB
assembly: Hand-soldered, 1206 passives
summary: >-
  An Arduino Uno R3–compatible board built around the ATmega328P and CH340G. It uses the same
  2-layer construction as a commercial Uno, but I laid it out for low switching noise and easy
  debugging. It met every functional goal, and with the same sketch, probes and scope settings, its
  quiet-pin noise came in at about 40% of the commercial board's.
target: Quiet-pin noise 20–50% of a commercial Uno
measured: 38% quiet high · 41% quiet low
stats:
  - { label: "Quiet-low noise", value: "0.90 V vs 2.21 V", note: "41% of commercial" }
  - { label: "Quiet-high noise", value: "0.82 V vs 2.17 V", note: "38% of commercial" }
  - { label: "5 V / 3.3 V / AVCC", value: "5.204 / 3.294 / 5.205 V" }
  - { label: "Supply current", value: "38 mA", note: "42 mA with LED" }
  - { label: "Peak inrush", value: "4.07 A", note: "then ~40 mA" }
  - { label: "Clocks", value: "16.00 MHz · 11.99 MHz" }
layout_svg: svg/board-3-layout.svg
photo: media/fig04-assembled-running-blink.jpg
photo_alt: Assembled Golden Arduino powered from USB, power and pin-13 LEDs lit while running Blink
photo_fallback: svg/stackup-top.svg
links:
  report: /downloads/board-3-report.pdf
  gerbers: /downloads/board-3-gerbers.zip
  schematic: media/fig01-schematic.png
  model3d: null
---

## PLAN — Plan of record
The goal was an Uno R3–compatible board that uploads code over USB from the Arduino IDE, accepts any standard shield, and has much lower switching noise than the commercial board.

**It counts as working if:**
- the 5 V and 3.3 V rails are in range and the indicator LEDs light at power-up
- the ATmega328P takes a bootloader through the ICSP header
- the IDE uploads Blink, and a modified Blink, through the board's own USB port
- the headers match the Uno R3 footprint, so a shield fits
- quiet-high and quiet-low noise are 20–50% of a commercial Uno's

**Features I added for test, debug and low noise:**
- Solid GND plane on the bottom layer, so every signal has a short return path
- A 22 µF capacitor at every VCC pin, to hold the chip's supply steady when outputs switch
- L1 (10 µH) + C10 (22 µF) filter on AVCC, to keep digital noise off the analog supply
- 0.5 Ω sense resistor, so inrush and steady-state current can be measured with a scope
- JP1 power-select jumper, so USB and the barrel jack can never both feed the board
- LEDs on 5 V, 3V3, TX, RX and pin 13 for quick visual status
- 11 four-pin test points (signal + 3 GND), so every probe point has ground right beside it

lead: An Uno R3–compatible board that uploads from the Arduino IDE over USB, fits any shield, and is much quieter than the commercial Uno. I designed the test features in from the start: a solid ground plane, a 22 µF cap at every VCC pin, and a 4-pin test point at every probe spot.
keys:
  - { label: "Noise target", value: "20–50% of a commercial Uno" }
  - { label: "Test points", value: "11 × 4-pin, signal + 3 GND" }
  - { label: "Board", value: "76.2 × 76.2 mm, 2-layer" }
media: svg/stackup-top.svg
caption: Board 3 rendered from my fabrication Gerbers

## SCHEMATIC — Parts & schematic
The schematic has four sections: power, USB/UART, MCU and headers. All passives use 1206 footprints so they can be hand-soldered.

- **Power:** a USB mini-B (J1) and a 5 V barrel jack (J2) both feed JP1. One jumper picks the source, with no MOSFET and no diode drop. R1 (0.5 Ω) sits between the selected input and +5 V, with test points IS+ and IS− on either side. An AMS1117-3.3 supplies only the 3.3 V header pin. JP2 and JP3 isolate the CH340 and the MCU for bring-up.
- **USB/UART:** a TVS array protects the USB data lines from ESD. I named the UART nets after the chip that drives them (TX340, TX328) so the direction is never ambiguous. The TX/RX LEDs hang off +5V_CH340 through 1 kΩ, outside the signal path. The CH340G runs at 5 V, so its DTR swing is large enough to reset the ATmega.
- **MCU:** each VCC pin of the ATmega328P-AU has its own 22 µF cap. The 16 MHz crystal has 22 pF load caps and a 1 MΩ feedback resistor. Reset uses a 10 kΩ pull-up, a 47 nF debounce cap, and C14 to couple the CH340's DTR pulse. J3 is a 6-pin ICSP header.
- **Headers:** exact Uno R3 footprint, with a row of GND pins 300 mil outside each signal row, plus breakout test points for SDA and SCL.

lead: Four sections: power, USB/UART, MCU and headers. One jumper picks USB or barrel-jack power with no diode drop, a 0.5 Ω resistor lets the scope measure current, and every passive is 1206 so it can be hand-soldered.
keys:
  - { label: "MCU", value: "ATmega328P-AU @ 16 MHz" }
  - { label: "USB-UART", value: "CH340G @ 12 MHz" }
  - { label: "Current sense", value: "0.5 Ω" }
media: media/fig01-schematic.png
caption: Final schematic: power, USB/UART, MCU and headers

## LAYOUT — Layout
A 2-layer board, 3.0 × 3.0 in. All signals and power are routed on top. The bottom is a GND pour, broken only by a few short cross-unders. Signals use 6 mil traces with at least 6 mil clearance everywhere; power uses 20 mil.

- **I rotated the ATmega 45°,** so its pins fan straight out to the digital and analog headers with far fewer crossings.
- Each 22 µF decoupling cap sits right next to its VCC pin, with its own GND via.
- Both crystals and their 22 pF caps sit right at the IC pins.
- Connectors sit on the board edges, with the header positions matched exactly to the Uno R3.
- Every test strip and LED is labeled with what it measures or indicates, and JP1 is labeled USB / JACK.

lead: Everything routes on top so the bottom stays a solid ground pour. Rotating the ATmega 45° let its pins fan straight out to the headers, and each decoupling cap sits right at its pin with its own ground via.
keys:
  - { label: "Signal", value: "6 mil trace / 6 mil clearance" }
  - { label: "Power", value: "20 mil" }
  - { label: "Headers", value: "exact Uno R3 footprint" }
media: layout_svg
caption: Top copper, drawn trace by trace from my fabrication Gerbers
media2: media/fig02-layout-top.png
caption2: Top layer: copper and silkscreen

## REVIEW & FAB — Review & fabrication
After the design review and verification process, JLCPCB fabricated the bare boards, and I hand-soldered every part. Before applying any power, I inspected the bare board and checked the 5 V net to GND with a multimeter. No shorts.

lead: After design review, JLCPCB fabricated the bare boards and I hand-soldered every part. Before applying any power, I inspected the board and checked 5 V to ground with a multimeter.
keys:
  - { label: "Fab", value: "JLCPCB" }
  - { label: "Assembly", value: "hand-soldered, 1206" }
  - { label: "Shorts at first check", value: "none" }
media: media/fig03-bare-board.jpg
caption: Bare board as received from JLCPCB

## BRING-UP — Bring-up
1. **First power:** USB, with JP1 on the USB side. The 5 V and 3.3 V LEDs lit right away.
2. **The first snag:** my laptop didn't see the CH340 serial port. I hadn't installed JP2, so the CH340 had no power. With JP2 and JP3 on, the board enumerated. The isolation jumpers did their job; they just needed clearer labels.
3. **Bootloading:** I used an Arduino Uno running ArduinoISP, wired to the ICSP header. The board was on its own USB power, so I left the 5 V wire off. The bootloader burned on the first try.
4. **First sketch:** Blink uploaded over the board's own USB port and pin 13 blinked at 1 Hz. The CH340 resets the ATmega automatically: during an upload it pulls RESET down to 270 mV through C14, with no button press needed.

**What I learned:**
- Two single-ended probes don't make a current meter. An 11.6 mV offset between them was as large as the ~20 mV across R1. Next time: a differential probe, or a multimeter across the sense resistor.
- Probe placement matters. Probing the LED side of R9 showed about 2 V instead of the 5 V D13 level. The frequency was right, but a dedicated D13 test point would have avoided it.
- Check the test plan against the requirements before leaving the lab. I thought I was done, then found missing measurements while writing the report. Now I write the checklist from the lab manual beforehand and tick off each scope shot as I save it.

lead: Both rails lit on first power. The CH340 didn't enumerate until I fitted its isolation jumper; after that the bootloader burned on the first try and Blink uploaded over the board's own USB port.
keys:
  - { label: "Bootloader", value: "first try, via ICSP" }
  - { label: "Auto-reset", value: "RESET pulled to 270 mV" }
  - { label: "Blink", value: "1 Hz on pin 13" }
media: media/fig04-assembled-running-blink.jpg
caption: Assembled, powered, and running Blink
media2: media/fig09-scope-reset-dtr.png
caption2: RESET (TP8) during an upload: the CH340's DTR pulse resets the ATmega

## RESULTS — Results
**Switching noise vs. a commercial Uno.** I ran the same sketch on both boards: D2 held high (quiet high), D3 held low (quiet low), and D4–D7 toggling together as fast as the chip allows. Probes, scope settings (200 ns/div, 500 mV/div, trigger on D4 at 2.5 V) and jumper-wire connections were identical on both. On my board each probe was grounded at the test point right beside its pin. On the Uno, all three went to the GND pin next to D13.

| Quiet pin | Golden | Commercial | Ratio |
|---|---|---|---|
| Quiet low (D3) pk-pk | 0.90 V | 2.21 V | **41%** |
| Quiet high (D2) pk-pk | 0.82 V | 2.17 V | **38%** |

On both boards the noise spikes line up with the switching edges. When several pins switch at once, the sudden current makes ground and 5 V bounce, and the quiet pins pick it up. My board shows less for three reasons:
1. The solid bottom ground plane gives return current a wide, direct path, and the few traces that cut into it are very short.
2. Each VCC pin has its own 22 µF cap right at the pin, so the switching current only travels a short distance.
3. Every header signal has a GND pin right beside it. The commercial board has only a few GND pins at the headers.

*Limitation:* the jumper wires and probe ground leads add some ringing on both boards, so the absolute numbers read higher than the true on-board noise. The setup was identical on both boards, so the ratio is still a fair comparison. I didn't capture 5 V rail noise during switching, or the slammer test.

**Other measurements:**
- Rails: 5.204 V / 3.294 V / AVCC 5.205 V. The 5 V reads slightly high because the laptop's USB-C hub supplies about 5.2 V. AVCC matched +5 V within 1 mV, so the L1 filter adds no measurable drop.
- Inrush: 2.035 V peak across the 0.5 Ω sense resistor means 4.07 A for a moment while the caps charge, settling to about 40 mA.
- Clocks: 16.00 MHz (760 mV pk-pk) and 11.99 MHz (4.62 V pk-pk). A modified Blink (100 ms on / 100 ms off) measured 4.9997 Hz, which shows that the bootloader, USB upload and 16 MHz clock all work.
- UART: a message from the laptop arrives on TX340, and the reply returns on TX328 about 250 ms later.

**What I'd change in Rev B:**
- add a D13 test point
- raise the reset debounce cap C13 from 47 nF to 1 µF, and the DTR coupling cap C14 from 1 µF to 22 µF
- add silkscreen notes for the default jumper positions
- make the board slightly larger so no silkscreen gets clipped

lead: Same sketch, same probes, same scope settings on both boards: my board's quiet-pin noise came in at about 40% of the commercial Uno's. Flip between REF A and REF B on the scope to compare.
keys:
  - { label: "Quiet low", value: "0.90 V vs 2.21 V · 41%" }
  - { label: "Quiet high", value: "0.82 V vs 2.17 V · 38%" }
  - { label: "Modified Blink", value: "4.9997 Hz" }
media: compare
compare_a: media/fig10-scope-noise-golden.png
compare_a_label: Golden Arduino: 0.90 V / 0.82 V
compare_b: media/fig11-scope-noise-commercial-uno.png
compare_b_label: Commercial Uno: 2.21 V / 2.17 V
sim_a: b3-golden
sim_b: b3-uno
verdict: Golden board: 41% of the Uno's quiet-low noise, 38% of its quiet-high
caption: Same sketch, same probes, same scope settings. CH1 = D4 (switching), CH2 = D3 (quiet low), CH3 = D2 (quiet high)
gallery:
  - { src: media/fig06-scope-rails.png, caption: "Rail DC levels: CH1 +5 V, CH2 +3V3, CH3 AVCC" }
  - { src: media/fig07-scope-inrush.png, caption: "Inrush at plug-in: voltage across the 0.5 Ω sense resistor (purple)" }
  - { src: media/fig08-scope-modified-blink.png, caption: "Modified Blink at 4.9997 Hz" }
  - { src: media/fig05-probe-points.png, caption: "Probe points used for testing" }
