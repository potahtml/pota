---
title: CSSStyleSheet
subpath: pota/use/css
topic: Styling
desc: The global CSSStyleSheet constructor, re-exported.
---

# CSSStyleSheet

`CSSStyleSheet` re-exports the global
[`CSSStyleSheet`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet)
constructor, so you can construct sheets directly without reaching for
`window`. For a cached, string-keyed factory use
[`sheet`](/use/css/sheet) instead.

## Examples

### Construct a sheet directly

Builds a sheet by hand and adopts it. Use this when you need a fresh,
uncached instance; reach for [`sheet`](/use/css/sheet) when you want
caching by CSS string.

```jsx
import { CSSStyleSheet, addAdoptedStyleSheet } from 'pota/use/css'

const s = new CSSStyleSheet()
s.replaceSync('body { background: black }')

addAdoptedStyleSheet(document, s)
```
