---
title: onDocumentVisible
subpath: pota/use/visibility
topic: Browser
desc: Run a callback whenever document visibility changes.
---

# onDocumentVisible

`onDocumentVisible(fn)` calls `fn` once with the current visibility
boolean, then again whenever the document is shown or hidden — use it
for pausing timers, stopping animations, or refreshing data when the
tab regains focus.
For a reactive accessor use
[`useDocumentVisible`](/use/visibility/useDocumentVisible). Part of
[`pota/use/visibility`](/use/visibility).

It must be called **within a reactive scope** (a component body, an
[effect](/effect), a [root](/root), etc.). Internally it subscribes to
`visibilitychange` inside an effect and registers its teardown with
the surrounding owner; when that scope disposes, the subscription is
removed. Called with no owner there is nothing to clean up the
listener and it leaks.

## Arguments

| Argument | Type                         | Description                                        |
| -------- | ---------------------------- | -------------------------------------------------- |
| `fn`     | `(visible: boolean) => void` | Called once on subscription, then on each change.  |

**Returns:** `undefined`.

## Examples

### Logging visibility changes

Appends a timestamped entry to the log each time the tab is shown or
hidden — the first entry appears immediately, from the initial call
with the current value. Because the subscription is owned by the
component, it is removed automatically when the component unmounts.

```jsx
import { render, signal } from 'pota'
import { onDocumentVisible } from 'pota/use/visibility'

function App() {
	const log = signal([])

	onDocumentVisible(visible => {
		log.update(entries => [
			...entries,
			`${new Date().toLocaleTimeString()} — ${
				visible ? 'visible' : 'hidden'
			}`,
		])
	})

	return (
		<div>
			<p>Switch tabs to populate the log:</p>
			<ul>
				{() =>
					log.read().map(entry => (
						<li>
							<code>{entry}</code>
						</li>
					))
				}
			</ul>
		</div>
	)
}

render(App)
```
