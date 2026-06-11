---
title: syncEffect
subpath: pota
topic: Reactive core
desc:
  Like effect, but runs immediately on creation and re-runs ahead of
  regular effects within the update batch.
---

# syncEffect

Like [effect](/effect), but it runs immediately when created — even in
the middle of an update — and its re-runs fire ahead of regular
effects within the same batch. pota itself uses it where setup must
complete before user code observes it: context providers and
[catchError](/catchError) boundaries. Pick it when creation-time or
ordering guarantees matter — for everything else, `effect` is the
right primitive.

## Arguments

| name | type         | description                                  |
| ---- | ------------ | -------------------------------------------- |
| `fn` | `() => void` | function whose tracked reads become its deps |

**Returns:** `void`.

## Examples

### Synchronous snapshot

An [effect](/effect) created during a render runs at the end of the
render batch — after the component body has returned. `syncEffect`
runs during creation, so `snapshot` is already populated when the
static text below reads it.

```jsx
import { render, signal, syncEffect } from 'pota'

function App() {
	const count = signal(1)
	let snapshot

	syncEffect(() => {
		snapshot = count.read()
	})

	return (
		<div>
			<p>captured: {snapshot}</p>
			<button on:click={() => count.update(n => n + 1)}>
				bump (the variable updates; the static text keeps the first
				snapshot)
			</button>
		</div>
	)
}

render(App)
```
