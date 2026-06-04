---
title: exitFullscreen
subpath: pota/use/fullscreen
topic: Browser
desc: Imperatively leave fullscreen.
---

# exitFullscreen

`exitFullscreen()` imperatively leaves fullscreen. Its counterpart is
[`requestFullscreen`](/use/fullscreen/requestFullscreen). Part of
[`pota/use/fullscreen`](/use/fullscreen).

## Arguments

Takes no arguments.

**Returns:** `Promise<void>` — resolves once the browser has exited
fullscreen.

## Examples

### Exit fullscreen on click

Wire a button to leave fullscreen imperatively.

```jsx
import { render } from 'pota'
import { exitFullscreen } from 'pota/use/fullscreen'

function App() {
	return (
		<button on:click={() => exitFullscreen()}>exit fullscreen</button>
	)
}

render(App)
```
