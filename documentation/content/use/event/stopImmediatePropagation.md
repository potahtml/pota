---
title: stopImmediatePropagation
subpath: pota/use/event
topic: Events
desc: One-liner handler that calls event.stopImmediatePropagation().
---

# stopImmediatePropagation

`stopImmediatePropagation(e)` calls `e.stopImmediatePropagation()`,
which stops bubbling _and_ prevents other listeners on the same
element from running. For all three stop methods at once use
[`stopEvent`](/use/event/stopEvent). Part of
[`pota/use/event`](/use/event).

## Examples

### Stop other listeners too

`on:click` takes an array of handlers, each attached as its own
listener. The first calls `stopImmediatePropagation`, so the second
handler on the same button never runs and the click never reaches the
wrapper. Plain [`stopPropagation`](/use/event/stopPropagation) would
let the second handler run; only the _immediate_ form stops siblings
on the same element.

```jsx
import { render } from 'pota'
import { stopImmediatePropagation } from 'pota/use/event'

function App() {
	return (
		<div on:click={() => console.log('wrapper — never reached')}>
			<button
				on:click={[
					stopImmediatePropagation,
					() => console.log('second handler — never runs'),
				]}
			>
				handled, exclusively
			</button>
		</div>
	)
}

render(App)
```
