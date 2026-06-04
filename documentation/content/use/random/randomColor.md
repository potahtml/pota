---
title: randomColor
subpath: pota/use/random
topic: Utilities
desc: A random 'rgb(r,g,b)' string.
---

# randomColor

Returns an `'rgb(r,g,b)'` string with each channel sampled via
[`randomBetween(min, max)`](/use/random/randomBetween) — narrow the
range to bias toward darker or lighter colors. Part of
[`pota/use/random`](/use/random).

## Arguments

| Argument | Type     | Description                           |
| -------- | -------- | ------------------------------------- |
| `min`    | `number` | Lowest channel value. Default `0`.    |
| `max`    | `number` | Highest channel value. Default `255`. |

**Returns:** `string` — an `'rgb(r,g,b)'` color string.

## Examples

### A random color

Samples the red, green, and blue channels independently. Raising `min`
keeps every channel bright, biasing toward lighter colors.

```js
import { randomColor } from 'pota/use/random'

randomColor() // e.g. 'rgb(132,7,201)'
randomColor(128, 255) // lighter
```
