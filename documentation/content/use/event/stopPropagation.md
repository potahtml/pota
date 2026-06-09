---
title: stopPropagation
subpath: pota/use/event
topic: Events
desc: One-liner handler that calls event.stopPropagation().
---

# stopPropagation

`stopPropagation(e)` calls `e.stopPropagation()` — drop it into an
`on:*` handler to stop the event bubbling. For all stop methods at
once use [`stopEvent`](/use/event/stopEvent). Part of
[`pota/use/event`](/use/event).

## Examples

### Stop bubbling

The outer handler counts the clicks it sees. Clicking the inner box
calls `stopPropagation`, so the event never bubbles up and the count
stays put; clicking anywhere else in the outer box still increments
it.

```jsx
import { render, signal } from 'pota'
import { stopPropagation } from 'pota/use/event'

function App() {
	const outerHits = signal(0)

	return (
		<div
			on:click={() => outerHits.update(n => n + 1)}
			style={{ padding: '1.5em', border: '1px solid #aaa' }}
		>
			outer — clicks here reach the handler
			<div
				on:click={stopPropagation}
				style={{
					margin: '1em',
					padding: '1em',
					border: '1px solid #aaa',
				}}
			>
				inner — clicks here are stopped
			</div>
			<p>outer handler fired: {outerHits.read} times</p>
		</div>
	)
}

render(App)
```
