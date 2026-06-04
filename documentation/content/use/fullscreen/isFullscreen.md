---
title: isFullscreen
subpath: pota/use/fullscreen
topic: Browser
desc: The current fullscreen element, or null (non-reactive read).
---

# isFullscreen

`isFullscreen()` returns the current fullscreen element, or `null`
when nothing is fullscreen — a one-off, non-reactive read. For a
reactive accessor use
[`useFullscreen`](/use/fullscreen/useFullscreen). Part of
[`pota/use/fullscreen`](/use/fullscreen).

## Arguments

Takes no arguments.

**Returns:** `Element | null` — the element currently in fullscreen,
or `null`.

## Examples

### One-off check

Read the fullscreen element once, without subscribing to changes.

```jsx
import { render } from 'pota'
import { isFullscreen } from 'pota/use/fullscreen'

function App() {
	return (
		<button
			on:click={() =>
				console.log(isFullscreen() ? 'fullscreen' : 'windowed')
			}
		>
			log state
		</button>
	)
}

render(App)
```
