---
title: Errored
kind: component
subpath: pota/components
topic: Flow
desc:
  Error boundary that catches throws from descendants and renders a
  fallback, with reset.
---

# `<Errored/>`

Error boundary. Catches errors thrown by descendants and renders a
`fallback` in their place. It protects its subtree from both
synchronous throws during render and reactive throws inside descendant
[effect](/effect), [memo](/memo) and [derived](/derived). The
programmatic form is [catchError](/catchError).

## Attributes

| name        | type                                 | description                                                                                                                                                                 |
| ----------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fallback?` | `any \| (err, reset) => JSX.Element` | what to render when a descendant throws. When the fallback is a function it receives the thrown value and a `reset` function that clears the error and re-runs the subtree. |
| `children`  | any                                  | the protected subtree                                                                                                                                                       |

## Notes

- `fallback` is optional. Without it, the subtree is replaced with
  nothing when an error is caught.
- Calling `reset` re-renders the protected children, so the error must
  have been resolved (for example, stale state replaced) or it will
  throw again.
- Errors that occur outside the reactive graph (detached `setTimeout`,
  microtasks, external event listeners) are not caught — keep async
  work reactive (return a promise from a component, use an
  [effect](/effect), or wrap callbacks with [owned](/owned)) so the
  error flows through the boundary.

## Examples

### Catch a synchronous throw

`Boom` throws during render until `ok` is set. The function `fallback`
receives the error and a `reset`; the retry button fixes the state,
then calls `reset()` to re-render the protected subtree.

```jsx
import { render, signal } from 'pota'
import { Errored } from 'pota/components'

const ok = signal(false)

function Boom() {
	if (!ok.read()) throw new Error('kaboom')
	return <p>Everything is fine now.</p>
}

render(
	<Errored
		fallback={(err, reset) => (
			<div>
				<p>Something broke: {String(err)}</p>
				<button
					on:click={() => {
						ok.write(true)
						reset()
					}}
				>
					retry
				</button>
			</div>
		)}
	>
		<Boom />
	</Errored>,
)
```

### Boundary with reset

Catches the throw from a descendant and renders `fallback`; calling
the `reset` passed to the function fallback clears the error and
re-renders the children. The protected child is a function so it
re-evaluates when `show` flips.

```jsx
import { render, signal } from 'pota'
import { Errored } from 'pota/components'

function Risky() {
	throw new Error('something broke')
}

function App() {
	const show = signal(false)

	return (
		<div>
			<button on:click={() => show.update(s => !s)}>toggle</button>
			<Errored
				fallback={(err, reset) => (
					<div>
						<p>error: {err.message}</p>
						<button on:click={reset}>retry</button>
					</div>
				)}
			>
				{() => (show.read() ? <Risky /> : <p>safe</p>)}
			</Errored>
		</div>
	)
}

render(App)
```

### Different fallback shapes

`fallback` accepts three shapes: a JSX element for a static "something
failed" view, a primitive (string/number) when you just want a
placeholder, or a `(err, reset) => JSX` function when you want to show
the error and let the user recover. The function form is the most
common.

```jsx
import { render, signal } from 'pota'
import { Errored, Match, Switch } from 'pota/components'

function Bomb() {
	throw new Error('kaboom')
}

function App() {
	const which = signal('static')

	return (
		<div>
			<button on:click={() => which.write('static')}>
				static jsx
			</button>
			<button on:click={() => which.write('value')}>
				plain value
			</button>
			<button on:click={() => which.write('function')}>
				function with reset
			</button>

			<Switch>
				<Match when={() => which.read() === 'static'}>
					<Errored fallback={<p>oh no, an error happened</p>}>
						<Bomb />
					</Errored>
				</Match>
				<Match when={() => which.read() === 'value'}>
					<Errored fallback="— ">
						<Bomb />
					</Errored>
				</Match>
				<Match when={() => which.read() === 'function'}>
					<Errored
						fallback={(err, reset) => (
							<div>
								<p>{err.message}</p>
								<button on:click={reset}>retry</button>
							</div>
						)}
					>
						<Bomb />
					</Errored>
				</Match>
			</Switch>
		</div>
	)
}

render(App)
```

### Async derived chain

`<Errored/>` also catches rejections from [`derived`](/derived)
chains, action pipelines, and async work in effects. Here parse
failures and HTTP errors land in the same fallback regardless of how
they were thrown — handy for network-driven views.

```jsx
import { derived, render, signal } from 'pota'
import { Errored } from 'pota/components'

function Catalog() {
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
			<button on:click={() => id.write(-1)}>force 404</button>
			<h2>{() => post()?.title ?? 'loading…'}</h2>
		</div>
	)
}

function App() {
	return (
		<Errored
			fallback={(err, reset) => (
				<div>
					<p>fetch failed: {err.message}</p>
					<button on:click={reset}>try again</button>
				</div>
			)}
		>
			<Catalog />
		</Errored>
	)
}

render(App)
```

### Rejected promise from a component

A component may return a promise — pota awaits it and renders the
resolved value, or, if it rejects, throws the rejection back into the
reactive scope where `<Errored/>` catches it. Clicking `reset`
re-creates the subtree, so `AsyncBoom` runs again with a fresh
promise.

```jsx
import { render, signal } from 'pota'
import { Errored, Suspense } from 'pota/components'

const ok = signal(false)

function AsyncBoom() {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			ok.read()
				? resolve(<p>Everything is fine now.</p>)
				: reject(new Error('fetch failed'))
		}, 800)
	})
}

render(
	<Errored
		fallback={(err, reset) => (
			<div>
				<p>Something broke: {String(err)}</p>
				<button
					on:click={() => {
						ok.write(true)
						reset()
					}}
				>
					retry
				</button>
			</div>
		)}
	>
		<Suspense fallback={<p>Loading…</p>}>
			<AsyncBoom />
		</Suspense>
	</Errored>,
)
```
