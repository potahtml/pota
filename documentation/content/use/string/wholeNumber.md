---
title: wholeNumber
subpath: pota/use/string
topic: Utilities
desc: Drop the fractional part; coerce NaN to 0.
---

# wholeNumber

`wholeNumber(num)` is `+num | 0` — it drops the fractional part and
coerces `NaN` to `0`. The bitwise `| 0` operates on 32-bit integers,
so values beyond ±2³¹ wrap around and `Infinity` becomes `0` — meant
for small UI numbers (indexes, sizes, counts). Part of
[`pota/use/string`](/use/string).

## Arguments

| Argument | Type     | Description       |
| -------- | -------- | ----------------- |
| `num`    | `number` | The value to trim |

**Returns:** the `number` with its fractional part dropped, or `0`
when the input is `NaN`.
