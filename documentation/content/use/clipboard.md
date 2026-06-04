---
title: clipboard
subpath: pota/use/clipboard
topic: Interaction
desc:
  Three clipboard ref factories — copy on click, and intercept paste.
---

# `pota/use/clipboard`

`pota/use/clipboard` ships three ref factories you attach with
`use:ref`: `clipboard(value)` copies on click,
[`pasteText`](/use/clipboard/pasteText) intercepts paste and strips
formatting, and [`pasteFiles`](/use/clipboard/pasteFiles) captures
pasted images and files.

`clipboard` accepts three value shapes:

- `function` — invoked with the click event; its return value is
  copied
- `string` or `number` — that literal value is copied
- `true` — the element's own `innerText` is copied

## Exports

- `clipboard(value)` — copy-on-click ref factory (documented below)
- [`pasteText(handler?)`](/use/clipboard/pasteText) — strip formatting
  on paste
- [`pasteFiles(handler)`](/use/clipboard/pasteFiles) — capture pasted
  files

## Examples

### Three value shapes

Each button copies via a different `value` shape: `true` copies the
element's own text, a string copies a fixed literal, and a function is
called with the click event and its return value is copied.

```jsx
import { render } from 'pota'
import { clipboard } from 'pota/use/clipboard'

function App() {
	return (
		<div>
			<button use:ref={clipboard(true)}>
				copy this label's text
			</button>
			<button use:ref={clipboard('hard-coded snippet')}>
				copy a fixed string
			</button>
			<button use:ref={clipboard(() => `time: ${Date.now()}`)}>
				copy current time
			</button>
		</div>
	)
}

render(App)
```
