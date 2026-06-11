---
title: random
subpath: pota/use/random
topic: Utilities
desc: Small crypto-backed randomness helpers, with a seeded LCG.
---

# `pota/use/random`

Small randomness helpers backed by `crypto.getRandomValues` — not
`Math.random` — plus a seeded LCG
([`randomSeeded`](/use/random/randomSeeded)) for reproducibility.

`random()` is the module's base generator: a crypto-strength float in
`[0, 1)`. The others draw on the same crypto source;
[`chance`](/use/random/chance) and
[`randomBetween`](/use/random/randomBetween) also accept a custom
`generator` so you can swap in a seeded one for deterministic runs.

## Exports

- `random()` — crypto-strength float in `[0, 1)` (documented below)
- [`randomBetween(min?, max?, generator?)`](/use/random/randomBetween)
  — integer in `[min, max]`, inclusive
- [`randomColor(min?, max?)`](/use/random/randomColor) —
  `'rgb(r,g,b)'` with each channel sampled
- [`randomId()`](/use/random/randomId) — base36 id string
- [`chance(percent?, generator?)`](/use/random/chance) — `true` with
  the given percentage probability
- [`randomSeeded(seed)`](/use/random/randomSeeded) — deterministic
  generator (linear-congruential)

## Arguments

`random()` takes no arguments.

**Returns:** a `number` in `[0, 1)`, read from
`crypto.getRandomValues`.

## Examples

### A random float

Reads one 32-bit value from `crypto` and scales it into `[0, 1)`.

```js
import { random } from 'pota/use/random'

random() // crypto-strength float in [0, 1)
```
