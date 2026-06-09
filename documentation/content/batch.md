---
title: batch
subpath: pota
topic: Reactive core
desc:
  Groups signal writes so dependent effects re-run once at the end
  instead of after each write.
---

# batch

Groups multiple writes so dependent effects re-run once at the end of
the batch instead of after each individual write. Most user code paths
(event handlers, cleanups) already batch — reach for `batch` when
you're synthesizing your own update boundary.

## Arguments

| name | type      | description                                                                                 |
| ---- | --------- | ------------------------------------------------------------------------------------------- |
| `fn` | `() => T` | function whose writes coalesce. Reads inside still track; only the propagation is deferred. |

**Returns:** the return value of `fn`.

## Examples

### Coalesce signal writes

Without `batch`, two writes back-to-back would fire two effect runs;
inside a batch, the effect runs once with the final state.

```jsx
import { batch, effect, render, signal } from 'pota'

function App() {
	const first = signal('Ada')
	const last = signal('Lovelace')
	const greeting = signal('hello, Ada Lovelace')

	effect(() => {
		greeting.write(`hello, ${first.read()} ${last.read()}`)
	})

	return (
		<div>
			<p>{greeting.read}</p>
			<button
				on:click={() =>
					batch(() => {
						first.write('Grace')
						last.write('Hopper')
					})
				}
			>
				rename (single effect run)
			</button>
		</div>
	)
}

render(App)
```

### Batch store mutations

Mutations against a `mutable` proxy notify observers per write. Wrap a
multi-step transition in `batch` so the result reaches readers as a
single transaction — invariants between fields hold even when the
intermediate state would be inconsistent.

```jsx
import { batch, render } from 'pota'
import { mutable } from 'pota/store'

const account = mutable({ debit: 100, credit: 0 })

function transfer(amount) {
	batch(() => {
		account.debit -= amount
		account.credit += amount
	})
}

function App() {
	return (
		<div>
			<p>debit: {() => account.debit}</p>
			<p>credit: {() => account.credit}</p>
			<button on:click={() => transfer(25)}>move 25</button>
		</div>
	)
}

render(App)
```
