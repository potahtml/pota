---
title: short
subpath: pota/use/string
topic: Utilities
desc: Truncate a string to 40 chars, appending an ellipsis.
---

# short

`short(string)` truncates `string` to 40 characters and appends `…`
when it had to cut. Strings of 40 characters or fewer are returned
unchanged. The argument defaults to `''`, so passing nothing yields an
empty string rather than throwing.

Part of [`pota/use/string`](/use/string).

## Arguments

| Argument | Type     | Description                               |
| -------- | -------- | ----------------------------------------- |
| `string` | `string` | The string to truncate. Defaults to `''`. |

**Returns:** `string` — the original string, or its first 40
characters plus `…`.

## Examples

### Truncate long text

Cuts overflowing text and leaves short text intact.

```jsx
import { short } from 'pota/use/string'

short('a short title') // 'a short title'
short('x'.repeat(100)) // 40 'x' characters followed by '…'
```
