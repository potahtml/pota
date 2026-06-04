---
title: requestFullscreen
subpath: pota/use/fullscreen
topic: Browser
desc: Imperatively put an element into fullscreen.
---

# requestFullscreen

`requestFullscreen(element)` imperatively puts `element` into
fullscreen. Its counterpart is
[`exitFullscreen`](/use/fullscreen/exitFullscreen); for a
click-to-toggle ref factory use `fullscreen` from
[`pota/use/fullscreen`](/use/fullscreen).

## Arguments

| Argument  | Type         | Description                       |
| --------- | ------------ | --------------------------------- |
| `element` | `DOMElement` | The element to put in fullscreen. |

**Returns:** the `Promise` from the element's native
`requestFullscreen()`.

## Examples

### Enter fullscreen for an element

Grab an element with [`ref`](/ref) and request fullscreen on click.

```jsx
import { ref, render } from 'pota'
import { requestFullscreen } from 'pota/use/fullscreen'

function App() {
	const stage = ref()

	return (
		<div>
			<button on:click={() => requestFullscreen(stage())}>
				go fullscreen
			</button>
			<div use:ref={stage}>stage</div>
		</div>
	)
}

render(App)
```
