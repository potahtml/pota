---
title: label
subpath: pota/use/string
topic: Utilities
desc: Turn a slug into a human-friendly label.
---

# label

`label(string)` turns a slug into a human-friendly label: it replaces
every `-` and `_` with a space, then collapses runs of whitespace into
a single space. Useful for deriving a readable heading from a route
segment or a key.

Part of [`pota/use/string`](/use/string). For the inverse direction
see [`dashesToCamelCase`](/use/string/dashesToCamelCase).

## Arguments

| Argument | Type     | Description           |
| -------- | -------- | --------------------- |
| `string` | `string` | The slug to humanize. |

**Returns:** `string` — the slug with separators turned into spaces.

## Examples

### Slug to heading

Labels a route segment for display.

```jsx
import { label } from 'pota/use/string'

label('my-cool_page') // 'my cool page'
label('hello___world') // 'hello world'
```
