---
title: css
subpath: pota/use/css
topic: Styling
desc:
  'Building blocks for constructable stylesheets: tagged-template css,
  cached sheet(), adoptedStyleSheets helpers.'
---

# `pota/use/css`

`pota/use/css` ships the building blocks for constructable
stylesheets: a tagged-template `css` and a cached `sheet(string)`
factory that both return a `CSSStyleSheet`, plus document /
shadow-root `adoptedStyleSheets` helpers. This is the low-level
surface the `css` / `use:css` prop is built on.

## Exports

- `css` — tagged-template wrapper over `String.raw` (documented below)
- [`sheet(string)`](/use/css/sheet) — cached `CSSStyleSheet` factory
- [`CSSStyleSheet`](/use/css/CSSStyleSheet) — the global constructor,
  re-exported
- [`getAdoptedStyleSheets(doc)`](/use/css/getAdoptedStyleSheets) — a
  document / shadow root's `adoptedStyleSheets`
- [`adoptedStyleSheets`](/use/css/adoptedStyleSheets) — the main
  document's `adoptedStyleSheets`, pre-bound
- [`addAdoptedStyleSheet(doc, sheet)`](/use/css/addAdoptedStyleSheet)
  — idempotent add
- [`removeAdoptedStyleSheet(doc, sheet)`](/use/css/removeAdoptedStyleSheet)
  — remove
- [`addStyleSheets(doc, sheets)`](/use/css/addStyleSheets) — add a
  mixed array of sheets, CSS strings, and URLs
- [`addStyleSheetExternal(doc, urlOrText)`](/use/css/addStyleSheetExternal)
  — single fetch-or-parse add

## Examples

### Tagged-template css

Builds a `CSSStyleSheet` from a tagged template. `css` is a thin
wrapper over `String.raw` that calls [`sheet()`](/use/css/sheet); the
tag exists so editors that recognise `` css`...` `` highlight your
styles. Adopt the result with
[`addAdoptedStyleSheet`](/use/css/addAdoptedStyleSheet).

```jsx
import { css, addAdoptedStyleSheet } from 'pota/use/css'

const styles = css`
	:host {
		display: block;
	}
	button {
		color: tomato;
	}
`

addAdoptedStyleSheet(document, styles)
```
