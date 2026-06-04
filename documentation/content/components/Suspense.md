---
title: Suspense
kind: component
subpath: pota/components
topic: Async
desc:
  Shows a fallback until the promises its descendants read have all
  resolved.
---

# `<Suspense/>`

Provides a `fallback` until the promises read by its descendants
resolve (recursively). Pairs with [derived](/derived) /
[withValue](/withValue) for the async work, and
[`<Errored/>`](/components/Errored) for the failure path.

## Attributes

| name        | type | description                            |
| ----------- | ---- | -------------------------------------- |
| `fallback?` | any  | shown while descendants' promises pend |
| `children`  | any  | the content to render once settled     |

## Examples

### Async fallback

`<Suspense/>` tracks promises read by descendants (via
[derived](/derived), [withValue](/withValue), or Suspense-aware
components) and shows `fallback` until they all resolve. Once the tree
is settled it swaps in the real content.

```jsx
import { derived, render, signal } from 'pota'
import { Suspense } from 'pota/components'

function App() {
	const id = signal(1)

	const post = derived(
		() =>
			fetch(
				`https://jsonplaceholder.typicode.com/posts/${id.read()}`,
			),
		res => res.json(),
	)

	return (
		<div>
			<button on:click={() => id.update(n => n + 1)}>next</button>
			<Suspense fallback={<p>loading…</p>}>
				<h2>{() => post().title}</h2>
				<p>{() => post().body}</p>
			</Suspense>
		</div>
	)
}

render(App)
```

### Plain promises as children

A promise read directly in the tree counts as async work too: the
fallback stays until every promise child resolves.

```jsx
import { render } from 'pota'
import { Suspense } from 'pota/components'

function App() {
	return (
		<Suspense fallback="Loading..">
			{new Promise(r => setTimeout(() => r('loaded a'), 1000))}
			{new Promise(r => setTimeout(() => r('loaded b'), 1500))}
		</Suspense>
	)
}

render(App)
```

### Nested Suspense

Each `<Suspense/>` captures the async work read by its descendants
independently — the inner boundary can resolve while an outer boundary
is still waiting. Use this when a page has fast-loading chrome and a
slower content body: the chrome appears once its sources resolve, the
body fills in once theirs do.

```jsx
import { derived, render } from 'pota'
import { Suspense } from 'pota/components'

const profile = derived(
	() => new Promise(r => setTimeout(() => r({ name: 'Ada' }), 300)),
)
const feed = derived(
	() =>
		new Promise(r =>
			setTimeout(
				() =>
					r([
						{ id: 1, text: 'first' },
						{ id: 2, text: 'second' },
					]),
				1500,
			),
		),
)

function App() {
	return (
		<Suspense fallback={<p>loading shell…</p>}>
			<header>welcome, {() => profile().name}</header>

			<Suspense fallback={<p>loading feed…</p>}>
				<ul>{() => feed().map(item => <li>{item.text}</li>)}</ul>
			</Suspense>
		</Suspense>
	)
}

render(App)
```

### Chained components

A single `<Suspense/>` waits for async work read anywhere in its
subtree, even across nested child components — the fallback stays
until the deepest promise settles.

```jsx
import { render } from 'pota'
import { Suspense } from 'pota/components'

const waitFor = 1000

function A() {
	const start = performance.now()
	const async = () =>
		new Promise(r =>
			setTimeout(() => r(performance.now() - start), waitFor),
		)

	return (
		<Suspense fallback={<p>Loading...</p>}>
			<p>A {async()}</p>
			<B start={start} />
		</Suspense>
	)
}

function B(props) {
	const async = () =>
		new Promise(r =>
			setTimeout(() => r(performance.now() - props.start), waitFor),
		)

	return (
		<>
			<p>B {async()}</p>
			<C start={props.start} />
		</>
	)
}

function C(props) {
	const async = () =>
		new Promise(r =>
			setTimeout(() => r(performance.now() - props.start), waitFor),
		)

	return <p>C {async()}</p>
}

render(A)
```
