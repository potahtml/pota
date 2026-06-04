---
title: addStyleSheetExternal
subpath: pota/use/css
topic: Styling
desc:
  Add one stylesheet from a URL or CSS string (fetch-or-parse,
  cached).
---

# addStyleSheetExternal

`addStyleSheetExternal(document, text)` is the single-entry
fetch-or-parse path used by
[`addStyleSheets`](/use/css/addStyleSheets). A value starting with
`http` is fetched and parsed into a `CSSStyleSheet`; any other string
is passed through [`sheet()`](/use/css/sheet). The result is cached,
so one request services every custom element that wants the same URL
and all of them reference the same object. The resolved sheet is then
adopted on `document` via
[`addAdoptedStyleSheet`](/use/css/addAdoptedStyleSheet).

The adoption is asynchronous: the function returns immediately and the
sheet appears once the fetch (or parse) settles.

## Arguments

| Argument   | Type                     | Description                                      |
| ---------- | ------------------------ | ------------------------------------------------ |
| `document` | `Document \| ShadowRoot` | Target whose `adoptedStyleSheets` to add to.     |
| `text`     | `string`                 | A `http`-prefixed URL to fetch, or a CSS string. |

## Examples

### Adopt a remote stylesheet

Fetches a stylesheet by URL and adopts it once the request settles.
The second call reuses the cached request and the same sheet object.

```jsx
import { addStyleSheetExternal } from 'pota/use/css'

addStyleSheetExternal(document, 'https://example.com/theme.css')

// later, anywhere — no second request, same CSSStyleSheet
addStyleSheetExternal(document, 'https://example.com/theme.css')
```

### Adopt an inline CSS string

A value that does not start with `http` is parsed through
[`sheet()`](/use/css/sheet) instead of being fetched.

```jsx
import { addStyleSheetExternal } from 'pota/use/css'

addStyleSheetExternal(document, 'body { background: black }')
```
