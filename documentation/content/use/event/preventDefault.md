---
title: preventDefault
subpath: pota/use/event
topic: Events
desc: One-liner handler that calls event.preventDefault().
---

# preventDefault

`preventDefault(e)` calls `e.preventDefault()` — drop it straight into
an `on:*` handler. For all stop methods at once use
[`stopEvent`](/use/event/stopEvent). Part of
[`pota/use/event`](/use/event).

## Examples

### Prevent a link's default

Drops `preventDefault` straight into an `on:click` handler so the
anchor never navigates.

```jsx
import { render } from 'pota'
import { preventDefault } from 'pota/use/event'

function App() {
	return (
		<a
			href="https://example.com"
			on:click={preventDefault}
		>
			does not navigate
		</a>
	)
}

render(App)
```
