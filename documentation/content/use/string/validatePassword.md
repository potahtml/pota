---
title: validatePassword
subpath: pota/use/string
topic: Utilities
desc: Trimmed password if length ≥ 6, else false.
---

# validatePassword

`validatePassword(s)` returns the trimmed password if its length is ≥
6, otherwise `false`. The input is first run through
[`toString`](/use/string/toString), so surrounding whitespace is
stripped before the length check. Part of
[`pota/use/string`](/use/string).

## Arguments

| Argument | Type     | Description           |
| -------- | -------- | --------------------- |
| `s`      | `string` | The password to check |

**Returns:** the trimmed `string` when its length is ≥ 6, otherwise
`false`.
