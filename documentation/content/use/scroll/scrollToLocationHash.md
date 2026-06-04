---
title: scrollToLocationHash
subpath: pota/use/scroll
topic: Browser
desc: Scroll to the element matching window.location.hash, if any.
---

# scrollToLocationHash

`scrollToLocationHash()` scrolls to the element matching
`window.location.hash`, if one exists — useful after a client-side
navigation that changes the hash. It is a thin wrapper over
[`scrollToSelector`](/use/scroll/scrollToSelector) passing
`location.hash`. Part of [`pota/use/scroll`](/use/scroll).

## Arguments

Takes no arguments.

**Returns:** `true` when the hash matched an element, `false`
otherwise.

## Examples

### Honor the URL hash on a button press

Renders an anchored section and a button that re-scrolls to whatever
the current `location.hash` points at.

```jsx
import { render } from 'pota'
import { scrollToLocationHash } from 'pota/use/scroll'

function App() {
	return (
		<div>
			<a href="#target">go to target</a>
			<button on:click={() => scrollToLocationHash()}>
				re-scroll to hash
			</button>

			<div style={{ height: '120vh' }}>spacer</div>

			<section id="target">target section</section>
		</div>
	)
}

render(App)
```
