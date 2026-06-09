---
title: untrack
subpath: pota
topic: Reactive core
desc:
  Runs a function without subscribing the surrounding scope to any
  signal it reads.
---

# untrack

Runs `fn` without establishing reactive dependencies on anything it
reads. Use it inside a tracking scope when you want a value's
_current_ snapshot but don't want to re-run when it later changes. For
the explicit-deps form of an effect, see [on](/on).
[signal](/signal)'s `update(prev => next)` wraps the read in `untrack`
internally.

## Arguments

| name | type      | description                               |
| ---- | --------- | ----------------------------------------- |
| `fn` | `() => T` | function whose reads should not subscribe |

**Returns:** the return value of `fn`.

## Examples

### Snapshot a signal in an effect

Inside a tracking scope ([effect](/effect), [memo](/memo),
[derived](/derived)), reading a signal subscribes the surrounding
scope to its changes. Wrap the read in `untrack(() => …)` when you
want the value at this moment but don't want to re-run when it later
changes.

```jsx
import { effect, render, signal, untrack } from 'pota'

function App() {
	const a = signal(1)
	const b = signal(10)
	const log = signal('')

	effect(() => {
		// Re-runs only when `a` changes; `b` is read snapshot-style.
		log.write(
			`a = ${a.read()}, b was ${untrack(() => b.read())}`,
		)
	})

	return (
		<div>
			<p>{log.read}</p>
			<button on:click={() => a.update(n => n + 1)}>a++</button>
			<button on:click={() => b.update(n => n + 1)}>b++</button>
		</div>
	)
}

render(App)
```
