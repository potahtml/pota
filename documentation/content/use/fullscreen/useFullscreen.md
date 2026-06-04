---
title: useFullscreen
subpath: pota/use/fullscreen
topic: Browser
desc: Reactive signal accessor of the current fullscreen element.
---

# useFullscreen

`useFullscreen()` returns a read function for the current fullscreen
element (or `null`), updating whenever fullscreen changes. For a
one-off read use [`isFullscreen`](/use/fullscreen/isFullscreen); for a
plain callback use [`onFullscreen`](/use/fullscreen/onFullscreen).
Part of [`pota/use/fullscreen`](/use/fullscreen).

Call it **within a reactive scope** (a component body, effect, or
root). The subscription to `fullscreenchange` is created on first use
via the surrounding scope and torn down automatically when that scope
is cleaned up — calling it outside any scope leaks the listener.

**Returns:** `() => Element | null` — a read function; call it inside
JSX or a derivation to track the current fullscreen element.

## Examples

### Reactive fullscreen state

Render the current fullscreen state by reading `current()` inside a
derivation. Because `useFullscreen()` is called in the component body,
its listener is registered and cleaned up with the component.

```jsx
import { render } from 'pota'
import { fullscreen, useFullscreen } from 'pota/use/fullscreen'

function App() {
	const current = useFullscreen()

	return (
		<div use:ref={fullscreen()}>
			<p>{() => (current() ? 'fullscreen' : 'windowed')}</p>
			<button>Click anywhere in this box to toggle</button>
		</div>
	)
}

render(App)
```
