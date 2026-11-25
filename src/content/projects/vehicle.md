---
order: 2
eyebrow: ELECTRONICS DESIGN LAB · FINAL PROJECT
color: "#4fd1e8"
title: Autonomous human-following vehicle
demo: vehicle
facts:
  - { k: "Vehicle", v: "RC car · ESP32 + ESP32-CAM" }
  - { k: "Vision", v: "Python server · OpenCV" }
  - { k: "Loop", v: "Wi-Fi, closed loop" }
---
An RC car that finds a person and follows them. The ESP32-CAM streams live video to a Python server, where an OpenCV pipeline scores how confident it is that a person is in frame and where. The server sends steering commands back to the ESP32, closing the loop over Wi-Fi.
