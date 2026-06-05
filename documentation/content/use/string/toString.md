---
title: toString
subpath: pota/use/string
topic: Utilities
desc: Coerce a value to a trimmed string, with an optional max length.
---

# toString

`toString(s)` coerces `s` to a string via
[`ensureString`](/use/string/ensureString) and trims it. Pass a
non-zero `length` to also cap the result: it slices to `length`
characters and trims again (so trailing whitespace exposed by the
slice is removed).

Part of [`pota/use/string`](/use/string). Used by
[`validateEmail`](/use/string/validateEmail) to normalize input before
checking it.

## Arguments

| Argument | Type     | Description                                     |
| -------- | -------- | ----------------------------------------------- |
| `s`      | `string` | The value to coerce and trim.                   |
| `length` | `number` | Maximum length. `0` (the default) means no cap. |

**Returns:** `string` — the trimmed value, optionally truncated.

## Examples

### Trim and cap

Trims surrounding whitespace, with and without a length cap.

```jsx
import { toString } from 'pota/use/string'

toString('  hello  ') // 'hello'
toString('  hello world  ', 6) // 'hello' (sliced to 'hello ', re-trimmed)
```
