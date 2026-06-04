---
title: ensureString
subpath: pota/use/string
topic: Utilities
desc: Coerce anything to a string; falsy stays empty.
---

# ensureString

`ensureString(s)` is `String(s || '')` — it coerces anything to a
string, with falsy inputs staying empty. For a trimmed, optionally
length-capped variant see [`toString`](/use/string/toString). Part of
[`pota/use/string`](/use/string).

## Arguments

| Argument | Type      | Description          |
| -------- | --------- | -------------------- |
| `s`      | `unknown` | The value to coerce. |

**Returns:** the value coerced with `String(s || '')`, so any falsy
input (`0`, `null`, `undefined`, `''`, `false`, `NaN`) becomes `''`.
