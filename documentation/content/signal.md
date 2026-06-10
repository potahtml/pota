---
title: signal
subpath: pota
topic: Reactive core
desc:
  The leaf primitive of pota's reactive graph — holds a value and
  notifies observers when it changes.
---

# signal

The leaf primitive of pota's reactive graph. Holds a value, notifies
observers when it changes. Returns a `Signal` object with callables —
`read`, `write`, and `update` — so you keep the writer next to the
reader instead of threading separate variables. For derived values,
reach for [memo](/memo) / [derived](/derived); for side-effects that
mirror a signal, [effect](/effect).

## Arguments

| name       | type                                              | description                                                                                                                    |
| ---------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `value?`   | `T`                                               | initial value (default `undefined`)                                                                                            |
| `options?` | `{ equals?: false \| ((prev, next) => boolean) }` | `equals: false` notifies on every write (skip the equality check); a custom comparator decides what counts as "the same" value |

**Returns:** a `Signal` object with methods — `read()` reads (and
tracks), `write(next)` assigns and returns `true` when the value
changed, `update(fn)` reads the previous value _without tracking_ and
writes the result of `fn(prev)`. The methods are bound — pass
`signal.read` directly as a JSX child or handler without wrapping.

## API shape

```jsx
import { signal } from 'pota'

const count = signal(0)

count.read() // read
count.write(5) // write
count.update(n => n + 1) // update from previous, untracked
```

## Examples

### Counter

`signal(0)` with a button that bumps and another that resets. Pass
`count.read` (the method reference, not `count.read()`) as a JSX child
so the renderer re-runs it whenever the value changes. `update`
receives the previous value; `write` replaces it directly.

```jsx
import { render, signal } from 'pota'

function App() {
	const count = signal(0)

	return (
		<div>
			<p>Count: {count.read}</p>
			<button on:click={() => count.update(n => n + 1)}>+</button>
			<button on:click={() => count.write(0)}>reset</button>
		</div>
	)
}

render(App)
```

### Toggle

`update(prev => next)` is the right call when the new value depends on
the old — it receives the previous value and is wrapped in `untrack`
internally, so reading inside the updater never creates extra
subscriptions.

```jsx
import { render, signal } from 'pota'

function App() {
	const open = signal(false)

	return (
		<div>
			<button on:click={() => open.update(v => !v)}>
				{() => (open.read() ? 'close' : 'open')}
			</button>
			<p>panel is {() => (open.read() ? 'open' : 'closed')}</p>
		</div>
	)
}

render(App)
```

### Custom equality

Pass `{ equals: false }` to disable equality checks (every write
notifies), or `{ equals: fn }` to define what counts as the same
value. Here renaming Ada with the same `id` doesn't re-run the effect;
switching to Grace does.

```jsx
import { effect, render, signal } from 'pota'

function App() {
	const user = signal(
		{ id: 1, name: 'Ada' },
		{ equals: (a, b) => a.id === b.id },
	)
	const log = signal('user changed: Ada')

	effect(() => {
		log.write(`user changed: ${user.read().name}`)
	})

	return (
		<div>
			<p>current: {() => user.read().name}</p>
			<p>{log.read}</p>
			<button
				on:click={() => user.write({ id: 1, name: 'Ada Lovelace' })}
			>
				rename (same id — no re-run)
			</button>
			<button on:click={() => user.write({ id: 2, name: 'Grace' })}>
				switch user (different id — re-runs)
			</button>
		</div>
	)
}

render(App)
```

### Two-way input binding

Wire an input to a signal: `prop:value={name.read}` binds the DOM
property to the read method, and the `on:input` handler writes back.
For a richer two-way binding helper, see [use:bind](/use/bind).

```jsx
import { render, signal } from 'pota'

function App() {
	const name = signal('world')

	return (
		<div>
			<input
				prop:value={name.read}
				on:input={e => name.write(e.currentTarget.value)}
			/>
			<p>Hello, {name.read}!</p>
		</div>
	)
}

render(App)
```

### Encapsulated counter

Hide the writer behind a hook-style function that exposes just a
reader and named actions. The signal stays the source of truth
internally; consumers can't bypass the action API to write whatever
they like.

```jsx
import { render, signal } from 'pota'

function useCounter(initial = 0) {
	const count = signal(initial)
	return {
		read: count.read,
		increment: () => count.update(v => v + 1),
		decrement: () => count.update(v => v - 1),
		reset: () => count.write(initial),
	}
}

function App() {
	const counter = useCounter(10)

	return (
		<div>
			<p>{counter.read}</p>
			<button on:click={counter.increment}>+</button>
			<button on:click={counter.decrement}>−</button>
			<button on:click={counter.reset}>reset</button>
		</div>
	)
}

render(App)
```
