---
title: removeEvent
subpath: pota
topic: Events
desc:
  Imperative removeEventListener counterpart to addEvent — returns an
  on() that re-attaches the listener.
---

# removeEvent

Imperative event-listener helper, the counterpart to
[`addEvent`](/addEvent). `removeEvent(node, type, handler)` removes
the listener and returns an `on()` function that re-attaches it (with
no arguments). Reach for it when you need to detach earlier than the
owner's [`cleanup`](/cleanup) would — e.g. once a one-shot condition
is met.

## Arguments

| name      | type                                                  | description                                                           |
| --------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| `node`    | `Document \| Window \| Element`                       | the node from which to remove the event listener                      |
| `type`    | string                                                | event to remove, e.g. `click`. Case-sensitive, as with regular events |
| `handler` | fn \| `{ handleEvent, once?, passive?, capture?, … }` | reference to the handler that was added with [`addEvent`](/addEvent)  |

**Returns:** an `on()` function that re-attaches the listener.

## Examples

### Detach after a one-shot condition

Records the first mouse x-coordinate, then detaches its own listener
so it never runs again.

```jsx
import { addEvent, removeEvent, render, signal } from 'pota'

function App() {
	const firstX = signal('move the mouse')

	function onMove(e) {
		firstX.write(`first mouse x: ${e.clientX}`)
		removeEvent(window, 'mousemove', onMove)
	}

	addEvent(window, 'mousemove', onMove)

	return <p>{firstX.read}</p>
}

render(App)
```

### off / on round-trip

`addEvent` returns `off()`; `removeEvent` returns `on()` — the pair
lets you toggle a listener without re-stating the arguments. Click the
box to fire the handler; the buttons attach and detach it.

```jsx
import {
	addEvent,
	removeEvent,
	ready,
	ref,
	render,
	signal,
} from 'pota'

function App() {
	const box = ref()
	const status = signal('listener off — use the buttons')

	const handler = () => status.write('handler ran')

	// addEvent returns off() (removes); removeEvent returns on()
	// (re-adds). Captured once the box exists, then reused.
	let off, on
	ready(() => {
		off = addEvent(box(), 'click', handler)
		on = removeEvent(box(), 'click', handler)
	})

	return (
		<div>
			<div
				use:ref={box}
				style={{ padding: '1em', border: '1px solid #aaa' }}
			>
				click me
			</div>
			<button
				on:click={() => {
					off()
					status.write('listener off')
				}}
			>
				off()
			</button>
			<button
				on:click={() => {
					on()
					status.write('listener on — click the box')
				}}
			>
				on()
			</button>
			<p>{status.read}</p>
		</div>
	)
}

render(App)
```
