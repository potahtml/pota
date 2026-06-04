---
title: addAdoptedStyleSheet
subpath: pota/use/css
topic: Styling
desc:
  Add a single stylesheet to a document or shadow root (idempotent).
---

# addAdoptedStyleSheet

`addAdoptedStyleSheet(document, styleSheet)` adds a single
`CSSStyleSheet` to a `Document` or `ShadowRoot`. It is idempotent —
adding the same sheet twice leaves a single entry. Remove it again
with [`removeAdoptedStyleSheet`](/use/css/removeAdoptedStyleSheet).

## Arguments

| Argument     | Type                     | Description                                  |
| ------------ | ------------------------ | -------------------------------------------- |
| `document`   | `Document \| ShadowRoot` | Target whose `adoptedStyleSheets` to add to. |
| `styleSheet` | `CSSStyleSheet`          | The sheet to adopt.                          |

## Examples

### Add and remove a sheet

Adopts a stylesheet built with [`sheet()`](/use/css/sheet), then
removes it later. Adding twice is a no-op.

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
