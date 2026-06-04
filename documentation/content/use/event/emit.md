---
title: emit
subpath: pota/use/event
topic: Events
desc: Dispatch a CustomEvent from a node.
---

# emit

`emit(node, name, init?)` dispatches a `CustomEvent` from `node`.
`bubbles`, `cancelable`, and `composed` default to `true`; override
them in `init`. Listen as you would any event:
`on:my-event={handler}`. Part of [`pota/use/event`](/use/event).

## Examples

### Custom events with emit

Emit a `CustomEvent` from a referenced node and listen for it with a
namespaced `on:*` handler, reading its `detail` payload.

```jsx
import { ref, render, signal } from 'pota'
import { emit } from 'pota/use/event'

function App() {
	const target = ref()
	const last = signal('—')

	return (
		<div>
			<div
				use:ref={target}
				on:greet={e => last.write(e.detail.name)}
			>
				listening for <code>greet</code> events
			</div>

			<button
				on:click={() =>
					emit(target(), 'greet', { detail: { name: 'pota' } })
				}
			>
				dispatch greet
			</button>

			<p>last greeted: {last.read}</p>
		</div>
	)
}

render(App)
```
