---
title: chance
subpath: pota/use/random
topic: Utilities
desc: Returns true with a given percentage probability.
---

# chance

Returns `true` with the given percentage probability. Pass your own
`generator` (e.g. one from [`randomSeeded`](/use/random/randomSeeded))
for reproducible runs. Part of [`pota/use/random`](/use/random).

## Arguments

| Argument    | Type           | Description                                                            |
| ----------- | -------------- | ---------------------------------------------------------------------- |
| `chance`    | `number`       | Probability of `true`, from `0` to `100`. Default `50`.                |
| `generator` | `() => number` | Source of uniform floats in `[0, 1)`. Default [`random`](/use/random). |

**Returns:** `boolean` — `true` with `chance%` probability, `false`
otherwise.

## Examples

### A coin flip

Calls the generator and compares against `chance / 100`, so larger
percentages yield `true` more often.

```js
import { chance } from 'pota/use/random'

chance() // 50/50
chance(10) // true ~10% of the time
```
