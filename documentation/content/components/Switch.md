---
title: Switch
kind: component
subpath: pota/components
topic: Flow
desc: Renders the first matching Match branch, else a fallback.
---

# `<Switch/>`

Renders the first [`<Match/>`](/components/Match) child whose `when`
is truthy. If none match, renders `fallback` — or, if no explicit
`fallback` prop is set, a nested `<Match/>` with no `when` acts as the
default branch.

If the child of the matching `<Match/>` is a function, it receives a
signal carrying the current `when` value — the same callback pattern
as [Show](/components/Show).

## Attributes

| name        | type | description                                  |
| ----------- | ---- | -------------------------------------------- |
| `fallback?` | any  | rendered when no `<Match/>` branch is truthy |

## Examples

### Truthiness

`<Switch/>` renders the first branch whose `when` is truthy. Here
every `when` is falsy (`0`, `undefined`, `false`), so the `fallback`
wins.

```jsx
import { render } from 'pota'
import { Match, Switch } from 'pota/components'

function App() {
	return (
		<Switch fallback="Nothing got rendered!">
			<Match when={0}>0</Match>
			<Match when={undefined}>undefined</Match>
			<Match when={false}>false</Match>
		</Switch>
	)
}

render(App)
```

### Pick the first matching branch

`<Switch/>` evaluates each child `<Match/>` in order and renders the
first one whose `when` is truthy. Cleaner than nested `<Show/>`s when
you have several mutually-exclusive states.

```jsx
import { render, signal } from 'pota'
import { Match, Switch } from 'pota/components'

function App() {
	const status = signal('loading')

	return (
		<div>
			<button on:click={() => status.write('loading')}>
				loading
			</button>
			<button on:click={() => status.write('success')}>
				success
			</button>
			<button on:click={() => status.write('error')}>error</button>

			<Switch fallback={<p>unknown</p>}>
				<Match when={() => status.read() === 'loading'}>
					<p>loading…</p>
				</Match>
				<Match when={() => status.read() === 'success'}>
					<p>done!</p>
				</Match>
				<Match when={() => status.read() === 'error'}>
					<p>oh no</p>
				</Match>
			</Switch>
		</div>
	)
}

render(App)
```

### Matched value

Like `Show`, [`<Match/>`](/components/Match) invokes its children with
the matched value (reactively). Useful when the discriminator carries
data — for example a status object — and the body needs to read it
without re-checking.

```jsx
import { render, signal } from 'pota'
import { Match, Switch } from 'pota/components'

function App() {
	const result = signal({ kind: 'ok', value: 42 })

	return (
		<div>
			<button
				on:click={() =>
					result.write({
						kind: 'ok',
						value: Math.floor(Math.random() * 100),
					})
				}
			>
				ok
			</button>
			<button
				on:click={() => result.write({ kind: 'err', message: 'bad' })}
			>
				err
			</button>
			<Switch>
				<Match
					when={() => result.read().kind === 'ok' && result.read()}
				>
					{r => <p>got value: {() => r().value}</p>}
				</Match>
				<Match
					when={() => result.read().kind === 'err' && result.read()}
				>
					{r => <p>error: {() => r().message}</p>}
				</Match>
			</Switch>
		</div>
	)
}

render(App)
```

### Match as default branch

A `<Match/>` with no `when` is the implicit fallback: it renders when
no earlier branch matched, equivalent to setting the `fallback` prop.

```jsx
import { render, signal } from 'pota'
import { Match, Switch } from 'pota/components'

function App() {
	const role = signal('guest')

	return (
		<div>
			<button on:click={() => role.write('admin')}>admin</button>
			<button on:click={() => role.write('user')}>user</button>
			<button on:click={() => role.write('guest')}>guest</button>

			<Switch>
				<Match when={() => role.read() === 'admin'}>
					<p>full access</p>
				</Match>
				<Match when={() => role.read() === 'user'}>
					<p>limited access</p>
				</Match>
				<Match>
					<p>please sign in</p>
				</Match>
			</Switch>
		</div>
	)
}

render(App)
```

### Discriminated union

When a value carries a `kind` field, each `Match` checks for that
variant — perfect for state machines, result types, or remote-data
lifecycles. The matching branch gets the value through the children
render-prop, so it can read the variant-specific fields directly.

```jsx
import { render, signal } from 'pota'
import { Match, Switch } from 'pota/components'

function App() {
	const remote = signal({ kind: 'idle' })

	return (
		<div>
			<button on:click={() => remote.write({ kind: 'idle' })}>
				idle
			</button>
			<button on:click={() => remote.write({ kind: 'loading' })}>
				loading
			</button>
			<button
				on:click={() =>
					remote.write({ kind: 'error', message: 'network down' })
				}
			>
				error
			</button>
			<button
				on:click={() =>
					remote.write({ kind: 'ok', items: ['a', 'b', 'c'] })
				}
			>
				ok
			</button>

			<Switch>
				<Match when={() => remote.read().kind === 'idle'}>
					<p>nothing yet — pick something</p>
				</Match>
				<Match when={() => remote.read().kind === 'loading'}>
					<p>loading…</p>
				</Match>
				<Match
					when={() => remote.read().kind === 'error' && remote.read()}
				>
					{e => <p>error: {() => e().message}</p>}
				</Match>
				<Match
					when={() => remote.read().kind === 'ok' && remote.read()}
				>
					{r => <p>got {() => r().items.length} items</p>}
				</Match>
			</Switch>
		</div>
	)
}

render(App)
```
