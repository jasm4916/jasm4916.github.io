---
# Board 4 — IN PROGRESS. While status is in-progress the site shows only the summary, goal and the note below.
# When the report and Gerbers arrive, add the six stages the same way as board-3.md and set status: final.
ch: 4
status: in-progress
progress_note: >-
  I'm finishing this board's report now. The full case study (schematic, 4-layer layout, bring-up,
  firmware and Thevenin-resistance plots) goes up here as soon as it's done.
slug: board-4
title: The Instrument Droid
short: INSTRUMENT DROID
kind: 4-LAYER · ARDUINO SHIELD · DATA ACQUISITION
color: "#6fe39a"
wave: steps
legend: LOAD STEPS
readout: DAC → OP-AMP → MOSFET LOAD · THEVENIN R vs CURRENT
layers: 4
size: ""
tool: ""
assembly: Hand-soldered SMT
summary: >-
  A 4-layer Arduino Uno shield that measures the Thevenin output resistance of a voltage source as its
  load current changes. The Arduino steps a DAC, an op-amp turns that into gate drive for a MOSFET load,
  and reading the source voltage at each current step gives its Thevenin voltage and resistance across
  the load range.
target: Plot Thevenin resistance vs. load current, automatically
measured: ""
photo: null
links:
  report: null
  schematic: null
  model3d: null
---
