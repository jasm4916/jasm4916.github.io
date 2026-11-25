---
order: 1
eyebrow: SENIOR CAPSTONE · TEAM B1NARY SOLUTIONS · SPONSOR KEVIN HALLQUIST
color: "#e8b463"
title: Portable touchscreen neural guitar amp
demo: amp
role: The touchscreen UI, and the link between it and the Daisy Seed3
facts:
  - { k: "Amp models", v: "5 NAM captures, 48 kHz" }
  - { k: "Audio DSP", v: "Daisy Seed3" }
  - { k: "Touchscreen", v: "ESP32-S3 · 7\" · LVGL" }
  - { k: "Link", v: "COBS frames, CRC-16 checked" }
---
A portable practice amp for guitar. The Daisy Seed3 runs neural amp models (NAM): small neural networks trained on real amps like a Fender Twin and a Marshall JCM800, followed by a chain of effects. A 7-inch touchscreen controls all of it.

My part is that touchscreen and its link to the Seed. The UI follows our sponsor Kevin Hallquist's two rules: every knob opens one shared vertical slider instead of being dragged, and tapping an effect selects it while tapping it again bypasses it. Every change travels over the link as a small checked frame, and the Seed applies it to the sound, which is the loop the animation shows.
