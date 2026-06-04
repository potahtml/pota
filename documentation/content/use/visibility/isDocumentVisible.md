---
title: isDocumentVisible
subpath: pota/use/visibility
topic: Browser
desc: Synchronous, non-reactive read of document visibility.
---

# isDocumentVisible

`isDocumentVisible()` returns `true` when `document.visibilityState`
is `'visible'`, reading it fresh on each call. It does _not_ establish
a subscription — use it for one-off checks (e.g. inside an event
handler) where you don't need reactivity. For reactive forms see
[`useDocumentVisible`](/use/visibility/useDocumentVisible) and
[`onDocumentVisible`](/use/visibility/onDocumentVisible). Part of
[`pota/use/visibility`](/use/visibility).

## Arguments

This function takes no arguments.

**Returns:** `boolean` — `true` if the document is currently visible.

## Examples

### One-off check inside a handler

Reads the visibility state once when the button is clicked — no
subscription is created, so the value is a snapshot for that moment.

```jsx
import { render } from 'pota'
import { isDocumentVisible } from 'pota/use/visibility'

function App() {
	return (
		<button
			on:click={() =>
				console.log(isDocumentVisible() ? 'visible' : 'hidden')
			}
		>
			check visibility
		</button>
	)
}

render(App)
```
