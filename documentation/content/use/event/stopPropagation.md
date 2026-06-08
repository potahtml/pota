---
title: stopPropagation
subpath: pota/use/event
topic: Events
desc: One-liner handler that calls event.stopPropagation().
---

# stopPropagation

`stopPropagation(e)` calls `e.stopPropagation()` — drop it into an
`on:*` handler to stop the event bubbling. For all stop methods
at once use [`stopEvent`](/use/event/stopEvent). Part of
[`pota/use/event`](/use/event).

## Examples

### Stop bubbling

Clicking the inner box calls `stopPropagation`, so the event never
bubbles up to the outer handler.

```jsx
import { render } from 'pota'
import { stopPropagation } from 'pota/use/event'

function App() {
	return (
		<div on:click={() => console.log('outer — not reached')}>
			<div on:click={stopPropagation}>
				click does not reach ancestors
			</div>
		</div>
	)
}

render(App)
```
