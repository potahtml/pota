---
title: addStyleSheets
subpath: pota/use/css
topic: Styling
desc:
  Add a mixed array of CSSStyleSheet instances, CSS strings, and URLs.
---

# addStyleSheets

`addStyleSheets(document, styleSheets)` accepts a mixed array of
`CSSStyleSheet` instances and strings. Each `CSSStyleSheet` is adopted
directly via [`addAdoptedStyleSheet`](/use/css/addAdoptedStyleSheet);
each string is routed through
[`addStyleSheetExternal`](/use/css/addStyleSheetExternal) — strings
starting with `http` are fetched (cached, so one request services
every custom element that wants the same URL) and parsed into a sheet,
while plain CSS strings are passed through
[`sheet()`](/use/css/sheet). Falsy entries are skipped.

## Arguments

| Argument      | Type                        | Description                                            |
| ------------- | --------------------------- | ------------------------------------------------------ |
| `document`    | `Document \| ShadowRoot`    | Target whose `adoptedStyleSheets` to add to.           |
| `styleSheets` | `(CSSStyleSheet\|string)[]` | Sheets, CSS strings, or URLs to add. Defaults to `[]`. |

## Examples

### Adopt a mixed batch

Adds a constructed sheet, a remote URL, and an inline CSS string in a
single call. The kind of each entry decides how it is processed.

```jsx
import { sheet, addStyleSheets } from 'pota/use/css'

addStyleSheets(document, [
	sheet(':root { color-scheme: dark }'),
	'https://example.com/theme.css',
	'body { margin: 0 }',
])
```
