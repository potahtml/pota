---
title: removeAdoptedStyleSheet
subpath: pota/use/css
topic: Styling
desc: Remove a single stylesheet from a document or shadow root.
---

# removeAdoptedStyleSheet

`removeAdoptedStyleSheet(document, styleSheet)` removes a single
`CSSStyleSheet` from a `Document` or `ShadowRoot`'s adopted sheets. It
is the inverse of
[`addAdoptedStyleSheet`](/use/css/addAdoptedStyleSheet), and like it,
mutates the [`adoptedStyleSheets`](/use/css/adoptedStyleSheets) array
in place.

## Arguments

| Argument     | Type                     | Description                      |
| ------------ | ------------------------ | -------------------------------- |
| `document`   | `Document \| ShadowRoot` | Target whose sheets are mutated. |
| `styleSheet` | `CSSStyleSheet`          | The sheet to remove.             |

## Examples

### Add then remove a sheet

Adopt a sheet on the document, then drop it again later.

```jsx
import {
	sheet,
	addAdoptedStyleSheet,
	removeAdoptedStyleSheet,
} from 'pota/use/css'

const s = sheet('body { background: black }')
addAdoptedStyleSheet(document, s)
// ...later
removeAdoptedStyleSheet(document, s)
```
