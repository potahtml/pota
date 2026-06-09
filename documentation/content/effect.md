---
title: effect
subpath: pota
topic: Reactive core
desc:
  Runs a function once and again every time anything it read changes —
  for side-effects that mirror state.
---

# effect

`effect(fn)` runs `fn` once and again every time anything it read
changes. Use it for side-effects that mirror reactive state into the
outside world — logging, persistence, subscriptions, third-party
libraries. Prefer [memo](/memo) / [derived](/derived) when you can
derive a value instead of imperatively pushing it.

## Arguments

| name | type         | description                                                                                                                                                                                           |
| ---- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fn` | `() => void` | function whose tracked reads become the effect's dependencies. Re-runs after any tracked signal changes — scheduled, not synchronous (use [syncEffect](/syncEffect) if you need synchronous re-runs). |

**Returns:** `void`. The effect lives until its owner is disposed;
pair imperative setup with [cleanup](/cleanup) to detach listeners or
timers when the scope tears down. For deferred callbacks (timers,
promise continuations) that should become no-ops once the owner is
gone, see [owned](/owned).

## API shape

```jsx
import { effect, signal } from 'pota'

const count = signal(0)

effect(() => {
	// runs once now, and again whenever `count` changes
	console.log(count.read())
})
```

## Examples

### Log on change

Run a side-effect every time tracked state updates. Each click fires
the effect — the effect is scheduled, not synchronous.

```jsx
import { effect, render, signal } from 'pota'

function App() {
	const count = signal(0)
	const log = signal('click to start')

	effect(() => {
		log.write(`count is now ${count.read()}`)
	})

	return (
		<div>
			<button on:click={() => count.update(n => n + 1)}>
				{count.read}
			</button>
			<p>{log.read}</p>
		</div>
	)
}

render(App)
```

### Persist to localStorage

The effect re-runs whenever `theme` changes and writes the new value
to storage. The initial run also performs the first write, so the
stored value stays in sync from the moment the component mounts.

```jsx
import { effect, render, signal } from 'pota'

function App() {
	const theme = signal(localStorage.getItem('theme') ?? 'light')

	effect(() => {
		localStorage.setItem('theme', theme.read())
	})

	return (
		<div>
			<p>theme: {theme.read}</p>
			<button on:click={() => theme.write('light')}>light</button>
			<button on:click={() => theme.write('dark')}>dark</button>
		</div>
	)
}

render(App)
```

### Subscribe with cleanup

[cleanup](/cleanup) registers a callback to run when the surrounding
owner is disposed (a parent unmount, a re-rendered branch, or
`render()`'s returned disposer being called) — the right place to
detach listeners opened inside an effect. Move the pointer to see
`x`/`y` update; unmount the app and the listener detaches.

```jsx
import { cleanup, effect, render, signal } from 'pota'

function App() {
	const x = signal(0)
	const y = signal(0)

	effect(() => {
		const onMove = e => {
			x.write(e.clientX)
			y.write(e.clientY)
		}
		window.addEventListener('mousemove', onMove)
		cleanup(() => window.removeEventListener('mousemove', onMove))
	})

	return (
		<p>
			pointer at {x.read}, {y.read}
		</p>
	)
}

render(App)
```

### Debounced effect

When an effect should react to rapid signal changes (typing in a
search box, dragging a slider) but the side-effect is expensive,
debounce it. [useTimeout](/use/time) is owner-aware: each effect
re-run disposes the previous timer before a new one is scheduled, so
only the final keystroke fires the search.

```jsx
import { effect, render, signal } from 'pota'
import { useTimeout } from 'pota/use/time'

function App() {
	const query = signal('')
	const result = signal('—')

	effect(() => {
		const q = query.read()
		const timer = useTimeout(() => {
			result.write(q ? `searched for "${q}"` : '—')
		}, 400)
		timer.start()
	})

	return (
		<div>
			<input
				placeholder="type a query…"
				on:input={e => query.write(e.currentTarget.value)}
			/>
			<p>{result.read}</p>
		</div>
	)
}

render(App)
```
