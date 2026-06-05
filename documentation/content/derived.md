---
title: derived
subpath: pota
topic: Reactive core
desc:
  A lazy, writable memo that unwraps and tracks functions and promises
  recursively across staged callbacks.
---

# derived

A lazy, writable version of `memo` that unwraps and tracks functions
and promises recursively. Pass any number of stage callbacks — each
receives the resolved output of the previous stage. The body doesn't
run until the result is read; writing to a derived overrides the
computed value until one of its tracked sources changes again.

## Arguments

| name        | type                    | description                                                                                                                                                                                    |
| ----------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `...stages` | `Array<(prev?) => any>` | one or more functions to run in order. Each stage receives the resolved value of the previous stage (or `undefined` for the first). Returned functions and promises are unwrapped recursively. |

**Returns:** a callable signal — call it with no args to read, or pass
a value to override. `await` works too: a derived is thenable and
resolves once its current pending stage commits.
[isResolved(d)](/isResolved) reports `true` after the first commit.

## API shape

```jsx
import { derived, signal } from 'pota'

const base = signal(10)

const doubled = derived(() => base.read() * 2)

doubled() // read
doubled(50) // override (until base changes again)
```

## Examples

### Writable derived

`derived(fn)` is like `memo` but writable: `d()` reads, `d(value)`
writes. A manual write replaces the computed value until one of `fn`'s
tracked dependencies fires a re-run, at which point the chain takes
over again. Useful for values that are mostly auto-computed but
occasionally need an explicit override.

```jsx
import { derived, render, signal } from 'pota'

function App() {
	const base = signal(10)
	const total = derived(() => base.read() * 2)

	return (
		<div>
			<p>total: {total}</p>
			<button on:click={() => base.update(n => n + 1)}>
				bump base
			</button>
			<button on:click={() => total(999)}>override total</button>
		</div>
	)
}

render(App)
```

### Multi-stage chain

`derived(f0, f1, f2, ...)` runs the input through each stage in turn;
each stage receives the previous stage's resolved value. The chain
re-runs whenever any tracked source in any stage changes, but
individual stages re-run independently when their own deps fire. Type
into the input — every keystroke walks the chain to produce a slug.

```jsx
import { derived, render, signal } from 'pota'

function App() {
	const raw = signal('  Hello, World!  ')

	const cleaned = derived(
		() => raw.read(),
		s => s.trim(),
		s => s.toLowerCase(),
		s => s.replace(/[^a-z0-9]+/g, '-'),
	)

	return (
		<div>
			<input
				prop:value={raw.read}
				on:input={e => raw.write(e.currentTarget.value)}
			/>
			<p>slug: {cleaned}</p>
		</div>
	)
}

render(App)
```

### Async fetch

`derived` unwraps promises automatically — each stage's input is
already resolved by the time it runs. [isResolved(post)](/isResolved)
is `false` until the chain has committed at least once, so it doubles
as a loading flag.

```jsx
import { derived, isResolved, render, signal } from 'pota'

function App() {
	const id = signal(1)

	const post = derived(
		() => `https://jsonplaceholder.typicode.com/posts/${id.read()}`,
		url => fetch(url),
		res => res.json(),
	)

	return (
		<div>
			<button on:click={() => id.update(n => n + 1)}>next</button>
			<p>{() => (isResolved(post) ? post().title : 'loading…')}</p>
		</div>
	)
}

render(App)
```

### Async with Errored fallback

A `derived` with promises rejects through the reactive scope —
unhandled, the rejection routes to `console.error`. Wrap the consumer
in [`<Errored/>`](/components/Errored) so a failed `fetch` or
`res.json()` shows a fallback instead. The fallback's `reset`
re-mounts the children, and because the chain re-runs from the source
signal, bumping the trigger after reset starts a fresh attempt.

```jsx
import { derived, render, signal } from 'pota'
import { Errored } from 'pota/components'

function Post() {
	const id = signal(1)

	const post = derived(
		() => `https://jsonplaceholder.typicode.com/posts/${id.read()}`,
		url =>
			fetch(url).then(r => {
				if (!r.ok) throw new Error(`HTTP ${r.status}`)
				return r.json()
			}),
	)

	return (
		<div>
			<button on:click={() => id.update(n => n + 1)}>next</button>
			<button on:click={() => id.write(99999)}>break it</button>
			<h2>{() => post()?.title ?? 'loading…'}</h2>
		</div>
	)
}

function App() {
	return (
		<Errored
			fallback={(err, reset) => (
				<div>
					<p>request failed: {String(err)}</p>
					<button on:click={reset}>retry</button>
				</div>
			)}
		>
			<Post />
		</Errored>
	)
}

render(App)
```
