---
title: sheet
subpath: pota/use/css
topic: Styling
desc: Cached factory that turns a CSS string into a CSSStyleSheet.
---

# sheet

`sheet(css)` creates a `CSSStyleSheet` from a CSS string. It is cached
by source string — the same input always returns the same
`CSSStyleSheet` instance, so adopting it on many documents or custom
elements is cheap and they all share one object.

The underlying `replace` is asynchronous and accepts `@import`
statements referencing external resources. The tagged-template
[`css`](/use/css) is a thin wrapper that calls `sheet()` for you.

## Arguments

| Argument | Type     | Description              |
| -------- | -------- | ------------------------ |
| `css`    | `string` | The CSS source to parse. |

**Returns:** a `CSSStyleSheet` (cached per source string).

## Examples

### Cached by string

Identical inputs share one `CSSStyleSheet`, so repeated calls are
free.

```jsx
import { sheet } from 'pota/use/css'

const a = sheet(':host { display: block }')
const b = sheet(':host { display: block }')
// a === b
```

### Adopt a sheet on the document

Build a sheet from a string and adopt it via
[`addAdoptedStyleSheet`](/use/css/addAdoptedStyleSheet).

```jsx
import { sheet, addAdoptedStyleSheet } from 'pota/use/css'

addAdoptedStyleSheet(
	document,
	sheet('body { background: black; color: white }'),
)
```
