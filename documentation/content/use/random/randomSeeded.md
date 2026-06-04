---
title: randomSeeded
subpath: pota/use/random
topic: Utilities
desc: Deterministic generator (LCG) for reproducible randomness.
---

# randomSeeded

A linear-congruential generator: it returns a function that produces
deterministic floats in `[0, 1)`. Pass that function as the
`generator` argument to [`randomBetween`](/use/random/randomBetween) /
[`chance`](/use/random/chance) for reproducible runs — tests,
fixtures, replays. Part of [`pota/use/random`](/use/random).

## Arguments

| Argument | Type     | Description                        |
| -------- | -------- | ---------------------------------- |
| `seed`   | `number` | Seed for the generator's sequence. |

**Returns:** `() => number` — a generator producing deterministic
floats in `[0, 1)`. The same seed always yields the same sequence.

## Examples

### Reproducible randomness

Seeds the generator and feeds it to
[`randomBetween`](/use/random/randomBetween) — the same seed replays
the identical sequence across runs.

```js
import { randomSeeded, randomBetween } from 'pota/use/random'

const rng = randomSeeded(42)
randomBetween(0, 9, rng) // deterministic across runs
```
