---
title: passiveEvent
subpath: pota/use/event
topic: Events
desc: Wrap a handler as a passive listener object.
---

# passiveEvent

`passiveEvent(fn)` wraps a handler as `{ handleEvent, passive: true }`
so you get a passive listener without writing the object literal
yourself — pass the result to
[`addEventNative`](/use/event/addEventNative). Passive listeners can't
call `preventDefault`, which lets the browser scroll without waiting
on your handler. Part of [`pota/use/event`](/use/event).

## Examples

### A passive wheel listener

Wraps a `wheel` handler so the browser can scroll without waiting on
it, then attaches it with [addEventNative](/use/event/addEventNative).

```tsx
import { render, signal } from 'pota'
import { addEventNative, passiveEvent } from 'pota/use/event'

function App() {
	const log = signal('scroll to see wheel events')

	addEventNative(
		window,
		'wheel',
		passiveEvent((e: WheelEvent) => log.write(`wheel delta: ${e.deltaY}`)),
	)

	return <p>{log.read}</p>
}

render(App)
```
