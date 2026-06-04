---
title: randomBetween
subpath: pota/use/random
topic: Utilities
desc: Integer in [min, max] inclusive; accepts a custom generator.
---

# randomBetween

Returns an integer in `[min, max]`, inclusive and floored. Pass your
own `generator` (e.g. one from
[`randomSeeded`](/use/random/randomSeeded)) to opt out of crypto for
reproducible runs. Part of [`pota/use/random`](/use/random).

## Arguments

| Argument    | Type           | Description                                                            |
| ----------- | -------------- | ---------------------------------------------------------------------- |
| `min`       | `number`       | Lowest value in the range. Default `0`.                                |
| `max`       | `number`       | Highest value in the range. Default `100`.                             |
| `generator` | `() => number` | Source of uniform floats in `[0, 1)`. Default [`random`](/use/random). |

**Returns:** `number` — an integer in `[min, max]`, inclusive.

## Examples

### A bounded integer

Scales the generator's float across the range and floors it, so both
endpoints are reachable.

```js
import { randomBetween } from 'pota/use/random'

randomBetween(1, 6) // a die roll
```
