---
title: getAdoptedStyleSheets
subpath: pota/use/css
topic: Styling
desc: A document or shadow root's adoptedStyleSheets array.
---

# getAdoptedStyleSheets

`getAdoptedStyleSheets(document)` returns the `adoptedStyleSheets`
array of a `Document` or `ShadowRoot`. It is null-safe — passing a
nullish target returns `undefined` rather than throwing.

The pre-bound [`adoptedStyleSheets`](/use/css/adoptedStyleSheets) is
this called once with the main document. Mutate the returned array via
[`addAdoptedStyleSheet`](/use/css/addAdoptedStyleSheet) and
[`removeAdoptedStyleSheet`](/use/css/removeAdoptedStyleSheet) rather
than reassigning it.

## Arguments

| Argument   | Type                     | Description                           |
| ---------- | ------------------------ | ------------------------------------- |
| `document` | `Document \| ShadowRoot` | Target whose array is read. Optional. |

**Returns:** the target's `adoptedStyleSheets` array, or `undefined`
if `document` is nullish.

## Examples

### Read a shadow root's sheets

Reach into a custom element's shadow root to inspect or extend its
adopted sheets.

```jsx
import { getAdoptedStyleSheets, sheet } from 'pota/use/css'

const host = document.querySelector('my-widget')
const sheets = getAdoptedStyleSheets(host.shadowRoot)

sheets.push(sheet(':host { display: block }'))
```
