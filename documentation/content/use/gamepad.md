---
title: gamepad
subpath: pota/use/gamepad
topic: Input
desc:
  Reactive gamepad connect, button, trigger, and axis state, plus a
  snapshot.
---

# `pota/use/gamepad`

`pota/use/gamepad` exposes connect state, button presses, analog
triggers, and axis positions as reactive accessors, plus a
non-reactive snapshot for game loops.

The Gamepad API has no per-button events: state is sampled via
`navigator.getGamepads()` every frame. This module runs a singleton
`requestAnimationFrame` poll that starts on the first subscription and
stops once the last consumer disposes. Even connect / disconnect is
derived from the poll — one source of truth. Each reactive accessor
lazily allocates its backing signal the first time it's called for a
given (gamepad, button/axis) pair, so the poll only updates signals
consumers actually subscribed to.

## Exports

- [`useGamepadConnected(index?)`](/use/gamepad/useGamepadConnected) —
  reactive boolean
- [`useGamepadButton(button, gamepad?)`](/use/gamepad/useGamepadButton)
  — reactive boolean
- [`useGamepadTrigger(button, gamepad?)`](/use/gamepad/useGamepadTrigger)
  — reactive number `0..1`
- [`useGamepadAxis(axis, gamepad?)`](/use/gamepad/useGamepadAxis) —
  reactive number `-1..1`
- [`gamepadSnapshot(index?)`](/use/gamepad/gamepadSnapshot) —
  non-reactive `Gamepad | null` (no rAF poll)
