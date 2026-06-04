---
title: wholeNumber
subpath: pota/use/string
topic: Utilities
desc: Drop the fractional part; coerce NaN to 0.
---

# wholeNumber

`wholeNumber(num)` is `+num | 0` — it drops the fractional part and
coerces `NaN` to `0`. Part of [`pota/use/string`](/use/string).

## Arguments

| Argument | Type     | Description       |
| -------- | -------- | ----------------- |
| `num`    | `number` | The value to trim |

**Returns:** the `number` with its fractional part dropped, or `0`
when the input is `NaN`.
