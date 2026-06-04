---
title: useBeforeLeave
subpath: pota/use/location
topic: Routing
desc:
  Register a guard that can cancel navigation away from the current
  route.
---

# useBeforeLeave

Register a callback to run whenever the user tries to leave the
current route. The callback can be sync or async; if it returns (or
resolves to) `false`, navigation is cancelled. Rejecting a returned
promise counts as `false`. Call `useBeforeLeave` from within a route's
rendering — the guard is automatically cleared once the user navigates
to a location outside the route's path. Part of
[`pota/use/location`](/use/location).

## Arguments

| name | type                                | description                                                                                           |
| ---- | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `fn` | `() => boolean \| Promise<boolean>` | returning (or resolving to) `false` cancels the navigation. A rejected promise is treated as `false`. |

## Examples

### Preventing navigation

Each call shows a different way the guard can block or delay leaving
the route: a sync `false`, an async `false`, a rejected promise, and a
promise that resolves `true` only after a delay (navigation waits for
it). Register the guard from within the route's rendering so it clears
automatically once you leave.

```jsx
import { render } from 'pota'
import { Route } from 'pota/components'
import { useBeforeLeave } from 'pota/use/location'

function Editor() {
	// cancels navigation synchronously
	useBeforeLeave(() => false)

	// cancels navigation, async
	useBeforeLeave(async () => false)

	// cancels navigation, resolves to false
	useBeforeLeave(
		() =>
			new Promise(resolve => {
				setTimeout(() => resolve(false), 5_000)
			}),
	)

	// cancels navigation, rejected promise counts as false
	useBeforeLeave(
		() =>
			new Promise((resolve, reject) => {
				setTimeout(() => reject(), 5_000)
			}),
	)

	// allows navigation, but only after three seconds
	useBeforeLeave(
		() =>
			new Promise(resolve => {
				setTimeout(() => resolve(true), 3_000)
			}),
	)

	return <p>editing…</p>
}

function App() {
	return (
		<Route path="/editor">
			<Editor />
		</Route>
	)
}

render(App)
```
