---
title: Navigate
kind: component
subpath: pota/components
topic: Routing
desc: Declarative redirect — navigates to a path when it renders.
---

# `<Navigate/>`

Navigates to a new location from JSX. When it renders it calls
[`navigate(path, props)`](/use/location/navigate) and returns its
children, so it works as a declarative redirect. Useful as the body of
a fallback [`<Route>`](/components/Route), or inside a
[`<Show>`](/components/Show) to bounce the user when a condition is
met.

All attributes are forwarded straight to
[`navigate`](/use/location/navigate), so it accepts the same options —
including `delay`, which lets the children show briefly (a
"Redirecting…" notice) before the navigation fires.

## Attributes

| name        | type                     | description                                                                             |
| ----------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `path`      | `string`                 | destination URL. Relative paths are resolved against the current location.              |
| `params?`   | `Record<string, string>` | replaces `:name` segments in `path` with their URI-encoded values, same as `A`/`Route`. |
| `replace?`  | `boolean`                | use `history.replaceState` so no new history entry is added (default `false`).          |
| `scroll?`   | `boolean`                | scroll to the URL hash (if any) after navigating (default `true` — pass `false` to skip). |
| `delay?`    | `number`                 | milliseconds to wait before navigating. Useful to show the children before redirecting. |
| `children?` | `JSX.Element`            | content rendered in place during the navigation (for example a "Redirecting…" notice).  |

## Examples

### Redirect a removed page

Used as the body of a route, `<Navigate>` redirects as soon as the
route matches. `replace` swaps the history entry so the old URL
doesn't land in the back stack.

```jsx
import { render } from 'pota'
import { Navigate, Route } from 'pota/components'

function App() {
	return (
		<div>
			<Route path="/old-page">
				<Navigate
					path="/new-page"
					replace={true}
				/>
			</Route>
			<Route path="/new-page">
				<h2>the new page</h2>
			</Route>
		</div>
	)
}

render(App)
```

### Conditional redirect with a notice

Inside a [`<Show>`](/components/Show) fallback, `<Navigate>` bounces
the user when a condition isn't met. `delay` keeps the children
("Redirecting…") visible for a moment before the navigation fires.

```jsx
import { render, signal } from 'pota'
import { Navigate, Route, Show } from 'pota/components'

function App() {
	const loggedIn = signal(false)

	return (
		<div>
			<button on:click={() => loggedIn.write(true)}>log in</button>

			<Route path="/protected">
				<Show
					when={loggedIn.read}
					fallback={
						<Navigate
							path="/login"
							delay={1000}
						>
							Redirecting to login…
						</Navigate>
					}
				>
					<p>secret content</p>
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
