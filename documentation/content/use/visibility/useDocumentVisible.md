---
title: useDocumentVisible
subpath: pota/use/visibility
topic: Browser
desc: Reactive signal accessor for document visibility.
---

# useDocumentVisible

`useDocumentVisible()` returns a read function — call it inside JSX or
a derivation to re-run on every visibility change. For a one-off read
use [`isDocumentVisible`](/use/visibility/isDocumentVisible); for a
plain callback use
[`onDocumentVisible`](/use/visibility/onDocumentVisible). Part of
[`pota/use/visibility`](/use/visibility).

Call it **within a reactive scope** (a component body,
[effect](/effect), or [root](/root)). The subscription to
`visibilitychange` is created on first use through the surrounding
scope and torn down automatically when that scope is cleaned up;
multiple consumers share the one underlying listener. Calling it
outside any scope leaks the listener.

**Returns:** `() => boolean` — a read function returning `true` while
the document is visible.

## Examples

### Reactive visibility state

Reads `visible()` inside a derivation so the text updates whenever the
tab is shown or hidden. Because `useDocumentVisible()` is called in
the component body, its listener is registered and cleaned up with the
component.

```jsx
import { render } from 'pota'
import { useDocumentVisible } from 'pota/use/visibility'

function App() {
	const visible = useDocumentVisible()

	return (
		<p>
			Tab is currently{' '}
			<strong>{() => (visible() ? 'visible' : 'hidden')}</strong>.
			Switch to another tab and back to see the value change.
		</p>
	)
}

render(App)
```
