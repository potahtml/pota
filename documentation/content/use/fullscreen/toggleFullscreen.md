---
title: toggleFullscreen
subpath: pota/use/fullscreen
topic: Browser
desc: Toggle fullscreen for an element (defaults to documentElement).
---

# toggleFullscreen

`toggleFullscreen(element?)` enters fullscreen if nothing is
fullscreen, otherwise exits. The element defaults to
`document.documentElement`. For a click-to-toggle ref factory use
`fullscreen` from [`pota/use/fullscreen`](/use/fullscreen).

## Arguments

| Argument  | Type         | Description                                                           |
| --------- | ------------ | --------------------------------------------------------------------- |
| `element` | `DOMElement` | Optional. Element to enter fullscreen. Defaults to `documentElement`. |

**Returns:** [`isFullscreen()`](/use/fullscreen/isFullscreen) read
immediately after issuing the request. The Fullscreen API is
asynchronous, so this is still the pre-toggle state — for the settled
value subscribe with [`useFullscreen`](/use/fullscreen/useFullscreen).

## Examples

### Toggle the whole page or an element

A button that toggles the whole page, and another that toggles a
specific element grabbed with [`ref`](/ref).

```jsx
import { ref, render } from 'pota'
import { toggleFullscreen } from 'pota/use/fullscreen'

function App() {
	const stage = ref()

	return (
		<div>
			<button on:click={() => toggleFullscreen()}>toggle page</button>
			<button on:click={() => toggleFullscreen(stage())}>
				toggle stage
			</button>
			<div use:ref={stage}>stage</div>
		</div>
	)
}

render(App)
```
