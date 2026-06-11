---
title: Show
kind: component
subpath: pota/components
topic: Flow
desc:
  Renders its children when the when condition is truthy, else a
  fallback.
---

# `<Show/>`

Renders its children when `when` is truthy, else a `fallback`. For
reactivity, pass `when` as a reader (`flag.read`) or a function —
static values short-circuit and never re-evaluate. If `children` is a
callback, it receives a read-only signal (a [memo](/memo)) carrying
the current truthy value, so you can keep reading fresh values without
tearing down the tree.

For several mutually-exclusive branches reach for
[`<Switch/>`](/components/Switch) instead.

## Attributes

| name        | type | description                                |
| ----------- | ---- | ------------------------------------------ |
| `when`      | any  | once `when` is truthy, render the children |
| `fallback?` | any  | rendered when the condition is falsy       |

## Examples

### Toggle

`Show` mounts its children when `when` is truthy and `fallback`
otherwise. Pass the reader (`visible.read`) so the condition stays
reactive — `visible.read()` would be a one-time snapshot.

```jsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'

function App() {
	const visible = signal(true)

	return (
		<div>
			<button on:click={() => visible.update(v => !v)}>toggle</button>
			<Show
				when={visible.read}
				fallback={<p>hidden</p>}
			>
				<p>hello</p>
			</Show>
		</div>
	)
}

render(App)
```

### Destructured value

When `when` is truthy, `Show` invokes the children function with a
reactive accessor for the value — useful when downstream code needs
the value (and TypeScript knows it is non-null inside the branch).

```jsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'

function App() {
	const user = signal(null)

	return (
		<div>
			<button on:click={() => user.write({ name: 'Ada' })}>
				log in
			</button>
			<button on:click={() => user.write(null)}>log out</button>
			<Show
				when={user.read}
				fallback={<p>not logged in</p>}
			>
				{u => <p>welcome, {() => u().name}</p>}
			</Show>
		</div>
	)
}

render(App)
```

### Auth gate

`Show` is the natural primitive for "render this only when the user is
authenticated, else fall back". Combining it with
[`<Navigate/>`](/components/Navigate) turns the fallback into a
redirect — no inline conditionals, the intent reads top-to-bottom.

```jsx
import { render, signal } from 'pota'
import { Navigate, Route, Show } from 'pota/components'

function App() {
	const user = signal(null)

	return (
		<div>
			<button on:click={() => user.write({ name: 'Ada' })}>
				log in as Ada
			</button>
			<button on:click={() => user.write(null)}>log out</button>

			<Route path="/dashboard">
				<Show
					when={user.read}
					fallback={
						<Navigate
							path="/login"
							replace
						/>
					}
				>
					{u => <p>welcome, {() => u().name}</p>}
				</Show>
			</Route>

			<Route path="/login">
				<p>please log in</p>
			</Route>
		</div>
	)
}

render(App)
```

### Static true/false

A static (non-function) `when` short-circuits: the branch is decided
once and never re-evaluates.

```jsx
import { render } from 'pota'
import { Show } from 'pota/components'

function App() {
	return (
		<>
			<Show when={true}>Should show this text!</Show>
			<Show when={false}>Nope!</Show>
			<span> - the end</span>
		</>
	)
}

render(App)
```

### Reactive vs static when

Passing the reader (`showing.read`) keeps `Show` reactive; passing the
read value (`showing.read()`) takes a one-time snapshot that never
updates.

```jsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'

function App() {
	const showing = signal(true)

	return (
		<div>
			<button on:click={() => showing.update(v => !v)}>toggle</button>
			<Show when={showing.read}>This is reactive</Show> -{' '}
			<Show when={showing.read()}>This is not reactive</Show>
		</div>
	)
}

render(App)
```

### Callback value

When `children` is a function it receives a read-only signal carrying
the current `when` value. Read it with `value()`, or wrap it as
`{() => …}` to derive reactive content from it.

```jsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'

function App() {
	const score = signal(0.2)

	return (
		<div>
			<button on:click={() => score.write(Math.random())}>
				roll
			</button>
			<Show when={score.read}>
				{value => (
					<>
						<div>The value is: {value}</div>
						<div>
							Is the value above .5? {() => String(value() > 0.5)}
						</div>
					</>
				)}
			</Show>
		</div>
	)
}

render(App)
```

### Avoiding re-rendering

Wrapping a component in [resolve](/resolve) memoizes the result, so
the component is created once and reused across toggles instead of
being re-rendered each time `Show` swaps back in.

```jsx
import { render, resolve, signal } from 'pota'
import { Show } from 'pota/components'

function App() {
	const showing = signal(true)

	let rendered = 0
	function CountRenders() {
		rendered++
		return <span>This component rendered {rendered} times</span>
	}

	const Test = resolve(() => CountRenders)

	return (
		<div>
			<button on:click={() => showing.update(v => !v)}>toggle</button>
			<Show when={showing.read}>
				<Test />
			</Show>
		</div>
	)
}

render(App)
```

### Fallback

A `fallback` renders when the condition becomes falsy. It is
instantiated only while shown and disposed when the condition turns
truthy again.

```jsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'

function App() {
	const showing = signal(true)

	return (
		<div>
			<button on:click={() => showing.update(v => !v)}>toggle</button>
			<Show
				when={showing.read}
				fallback={<p>nothing here</p>}
			>
				Hey
			</Show>
		</div>
	)
}

render(App)
```

### Show in between

`Show` keeps its position between sibling elements and between text
nodes — toggling it does not disturb the surrounding markup.

```jsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'

function App() {
	const showing = signal(true)

	return (
		<div>
			<button on:click={() => showing.update(v => !v)}>toggle</button>
			<div>
				<span>1</span>
				<Show when={showing.read}>
					<span>2</span>
				</Show>
				<span>3</span>
			</div>
			<div>
				1<Show when={showing.read}>2</Show>3
			</div>
		</div>
	)
}

render(App)
```
