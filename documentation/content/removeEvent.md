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
lets you toggle a listener without re-stating the arguments.

```jsx
import { addEvent, removeEvent } from 'pota'

const node = document.createElement('main')
const handler = () => console.log('handler')

// add the listener; off() removes it
const off = addEvent(node, 'click', handler)

// remove the listener; on() adds it back
const on = removeEvent(node, 'click', handler)
```
