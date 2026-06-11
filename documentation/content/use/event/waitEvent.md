---
title: waitEvent
subpath: pota/use/event
topic: Events
desc: Resolve a promise with the next matching event.
---

# waitEvent

`waitEvent(element, eventName)` resolves with the next matching event
from `element` and removes its listener. Only one `waitEvent` is
pending per element: requesting another (whatever the event name)
before the old one fires rejects the earlier promise — so duplicate
`transitionend` / `animationend` handlers don't pile up. Part of
[`pota/use/event`](/use/event).

## Arguments

| Argument    | Type      | Description                                     |
| ----------- | --------- | ----------------------------------------------- |
| `element`   | `Element` | Element to listen on.                           |
| `eventName` | `string`  | Name of the event to wait for (e.g. `'click'`). |

**Returns:** a `Promise` that resolves with the dispatched event the
first time `eventName` fires on `element`.

## Examples

### Await a transition

Toggles a class to start a CSS transition, then awaits its
`transitionend` before logging — no manual `addEventListener` /
`removeEventListener` bookkeeping.

```jsx
import { render, signal } from 'pota'
import { waitEvent } from 'pota/use/event'

function App() {
	const open = signal(false)
	const log = signal('')

	let box

	async function toggle() {
		open.update(prev => !prev)
		await waitEvent(box, 'transitionend')
		log.write('transition finished')
	}

	return (
		<div>
			<button on:click={toggle}>toggle</button>
			<div
				use:ref={el => (box = el)}
				style={() => ({
					width: '100px',
					height: '100px',
					background: 'rebeccapurple',
					transition: 'transform 300ms ease',
					transform: open.read()
						? 'translateX(100px)'
						: 'translateX(0)',
				})}
			/>
			<p>{log.read}</p>
		</div>
	)
}

render(App)
```
