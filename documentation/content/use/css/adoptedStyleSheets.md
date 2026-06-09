---
title: adoptedStyleSheets
subpath: pota/use/css
topic: Styling
desc: The main document's adoptedStyleSheets, pre-bound.
---

# adoptedStyleSheets

`adoptedStyleSheets` is the main document's `adoptedStyleSheets`
array, pre-bound for direct access — equivalent to
[`getAdoptedStyleSheets(document)`](/use/css/getAdoptedStyleSheets).
For a shadow root or another document, call `getAdoptedStyleSheets`
with that target.

It is the same array the document exposes, so the
[`addAdoptedStyleSheet`](/use/css/addAdoptedStyleSheet) /
[`removeAdoptedStyleSheet`](/use/css/removeAdoptedStyleSheet) helpers
mutate it directly.

## Examples

### Inspect the adopted sheets

Reads the pre-bound array to see how many sheets the main document has
adopted.

```jsx
import { render } from 'pota'
import { adoptedStyleSheets, sheet } from 'pota/use/css'

document.adoptedStyleSheets.push(sheet('body { margin: 0 }'))

function App() {
	return <p>adopted sheets: {adoptedStyleSheets.length}</p>
}

render(App)
```
