---
title: isResolved
subpath: pota
topic: Reactive core
desc:
  True while every passed derived is resolved — false whenever any
  run is still pending.
---

# isResolved

`true` while every passed [derived](/derived) is resolved. A derived
is pending until its first value commits, and again while any re-run
is awaiting a promise — `isResolved` is `false` during those windows.
Reading it inside a tracking scope subscribes to the deriveds, so it
re-evaluates as they settle. Useful with
[`<Suspense/>`](/components/Suspense) or as a render-time guard for
async-driven values that start out as `undefined`.

## Arguments

| name          | type             | description                         |
| ------------- | ---------------- | ----------------------------------- |
| `...deriveds` | `Derived<any>[]` | one or more derived values to check |

**Returns:** `boolean` — `true` when no passed derived is pending.

## Examples

### Render a loading state

Async `derived` chains start unresolved — `isResolved` guards the
loading state on the first render and again on every refetch the
button triggers.

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
