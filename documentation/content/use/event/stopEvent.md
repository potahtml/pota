---
title: stopEvent
subpath: pota/use/event
topic: Events
desc:
  Call preventDefault, stopPropagation, and stopImmediatePropagation
  at once.
---

# stopEvent

`stopEvent(e)` calls all stop methods —
[`preventDefault`](/use/event/preventDefault),
[`stopPropagation`](/use/event/stopPropagation), and
[`stopImmediatePropagation`](/use/event/stopImmediatePropagation) — in
one call. Useful as a one-liner handler body, or composed with other
handlers. Part of [`pota/use/event`](/use/event).

## Examples

### Stop helpers

Drop the stop helpers directly into `on:*` handlers — `preventDefault`
suppresses the default action, while `stopEvent` does that plus halts
propagation and any sibling listeners.

```jsx
import { render } from 'pota'
import { stopEvent, preventDefault } from 'pota/use/event'

function App() {
	return (
		<div>
			<a
				href="https://example.com"
				on:click={preventDefault}
			>
				click me (default prevented, link does not navigate)
			</a>

			<hr />

			<button on:click={stopEvent}>
				button — click is swallowed (no default, no bubble)
			</button>
		</div>
	)
}

render(App)
```
