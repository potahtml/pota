---
title: scrollToTop
subpath: pota/use/scroll
topic: Browser
desc: Scroll the window to the top.
---

# scrollToTop

Scroll the window to the top. `scrollToTop()` calls
`window.scrollTo({ top: 0, behavior: 'auto' })`. Part of
[`pota/use/scroll`](/use/scroll).

## Examples

### Back to top button

Wire `scrollToTop` to a button so a long page can jump back to the top
on click.

```jsx
import { render } from 'pota'
import { scrollToTop } from 'pota/use/scroll'

function App() {
	return (
		<>
			<div style={{ height: '200vh' }}>Long page</div>
			<button on:click={scrollToTop}>Back to top</button>
		</>
	)
}

render(App)
```
