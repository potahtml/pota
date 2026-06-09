---
title: stopImmediatePropagation
subpath: pota/use/event
topic: Events
desc: One-liner handler that calls event.stopImmediatePropagation().
---

# stopImmediatePropagation

`stopImmediatePropagation(e)` calls `e.stopImmediatePropagation()`,
which stops bubbling _and_ prevents other listeners on the same
element from running. For all stop methods at once use
[`stopEvent`](/use/event/stopEvent). Part of
[`pota/use/event`](/use/event).

## Examples

### Stop other listeners too

`on:click` takes an array of handlers, each attached as its own
listener. Both buttons run a first handler, then a stop method, then a
second handler. With `stopImmediatePropagation` the second handler is
skipped — the log only shows `first ran`. Plain
[`stopPropagation`](/use/event/stopPropagation) stops bubbling but
lets siblings on the same element run, so the log shows
`first ran + second ran`.

```jsx
import { render, signal } from 'pota'
import {
	stopImmediatePropagation,
	stopPropagation,
} from 'pota/use/event'

function App() {
	const log = signal('click a button')

	return (
		<div>
			<button
				on:click={[
					() => log.write('first ran'),
					stopImmediatePropagation,
					() => log.update(s => s + ' + second ran'),
				]}
			>
				stopImmediatePropagation
			</button>
			<button
				on:click={[
					() => log.write('first ran'),
					stopPropagation,
					() => log.update(s => s + ' + second ran'),
				]}
			>
				stopPropagation
			</button>
			<p>{log.read}</p>
		</div>
	)
}

render(App)
```
