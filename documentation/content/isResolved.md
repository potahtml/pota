---
title: isResolved
subpath: pota
topic: Reactive core
desc:
  True once every passed derived has resolved at least once — a
  render-time guard for async values.
---

# isResolved

`true` once every passed [derived](/derived) has resolved at least
once. Useful with [`<Suspense/>`](/components/Suspense) or as a
render-time guard for async-driven values that start out as
`undefined`.

## Arguments

| name          | type             | description                         |
| ------------- | ---------------- | ----------------------------------- |
| `...deriveds` | `Derived<any>[]` | one or more derived values to check |

**Returns:** `boolean` — `true` when each argument has resolved at
least once.

## Examples

### Render a loading state

Async `derived` chains start unresolved — their value is `undefined`
until the first resolution. `isResolved` is the way to render a
loading state without reading an undefined value on the first render.

```jsx
import { derived, isResolved, render, signal } from 'pota'

function App() {
	const id = signal(1)

	const user = derived(
		() => `https://jsonplaceholder.typicode.com/users/${id.read()}`,
		url => fetch(url),
		res => res.json(),
	)

	return (
		<div>
			<button on:click={() => id.update(n => n + 1)}>next</button>
			<p>{() => (isResolved(user) ? user().name : 'loading…')}</p>
		</div>
	)
}

render(App)
```
