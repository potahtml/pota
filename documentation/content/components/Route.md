---
title: Route
kind: component
subpath: pota/components
topic: Routing
desc: Renders components by location path; routes nest.
---

# `<Route/>`

Renders children when [`location.path`](/use/location) matches its
`path`. It doesn't need a wrapper, and routes can be nested — a nested
route's `path` is relative to its parent. `:name` segments in the path
are captured and exposed via [`location.params`](/use/location).
`<Route.Default/>` renders a default / 404 when no sibling route
matches.

Pair with [`<A>`](/components/A) for route-aware links and
[`load`](/components/load) to lazy-load a route's `children`.

## Attributes

| name        | type                     | description                                                                                                                                                                                      |
| ----------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `path?`     | `string`                 | when the location matches this path, the route's children render. When omitted, the route matches only when the parent route's path matches the location exactly (the final / index route).      |
| `params?`   | `Record<string, string>` | replaces `:name` segments in `path` with their URI-encoded values. `<Route path="/some/:cat/:page" params={{ cat: 'variété', page: 'touché' }}/>` becomes `/some/vari%C3%A9t%C3%A9/touch%C3%A9`. |
| `when?`     | `When<any>`              | optional condition to stop rendering even when the path matches.                                                                                                                                 |
| `fallback?` | `JSX.Element`            | rendered while a `when` condition is falsy. Unused when `when` is not set.                                                                                                                       |
| `collapse?` | `When<any>`              | hide the route instead of unmounting it. Keeps state for iframes, canvas, video, audio, etc.                                                                                                     |
| `scroll?`   | `string \| string[]`     | selector(s) to scroll into view when the route matches (falls back to the URL hash, then the top of the page).                                                                                   |
| `children?` | `JSX.Element`            | what to render when the route matches.                                                                                                                                                           |

## Nested routes and params

Child `<Route>`s match relative to their parent's `path`, so paths
compose by declaration. `:name` segments are captured into the route's
location context; [`location.params`](/use/location) is a reactive map
whose keys update as the URL changes. Capture it once at component
setup (`const params = location.params`) and read keys reactively.

## Examples

### Client-side routing

`<Route path="...">` renders its children when the location matches —
declare a route per page and let pota mount the matching one. `<A>`
links drive navigation without a full page load.

```jsx
import { render } from 'pota'
import { A, Route } from 'pota/components'

function App() {
	return (
		<div>
			<nav>
				<A href="/">home</A>
				{' · '}
				<A href="/about">about</A>
				{' · '}
				<A href="/users/42">user 42</A>
			</nav>

			<Route path="/">
				<h2>welcome</h2>
			</Route>
			<Route path="/about">
				<h2>about us</h2>
			</Route>
			<Route path="/users/:id">
				<h2>user profile</h2>
				<p>(open the URL — :id is captured)</p>
			</Route>
		</div>
	)
}

render(App)
```

### Nested routes and params

Child routes match relative to their parent, and `:name` segments are
captured into the reactive [`location.params`](/use/location) map.
Capture `location.params` once, then read keys with a `{() => …}`
wrapper so the JSX updates as the URL changes.

```jsx
import { render } from 'pota'
import { A, Route } from 'pota/components'
import { location } from 'pota/use/location'

function UserDetail() {
	const params = location.params
	return (
		<div>
			<h2>user #{() => params.id}</h2>
			<p>open a different id to see this update</p>
		</div>
	)
}

function Post() {
	const params = location.params
	return <p>post: {() => params.slug}</p>
}

function App() {
	return (
		<div>
			<nav>
				<A href="/users/1">user 1</A>
				{' · '}
				<A href="/users/2">user 2</A>
				{' · '}
				<A href="/users/42/posts/intro">42 / posts / intro</A>
			</nav>

			<Route path="/users">
				<Route path=":id">
					<UserDetail />
					<Route path="posts/:slug">
						<Post />
					</Route>
				</Route>
			</Route>
		</div>
	)
}

render(App)
```

### Relative links and the index route

A `<Route>` without a `path` is the index route — it renders only when
the parent path matches exactly. `<A>` links inside a route resolve
relative to that route, so `uno/` from within `/` navigates to
`/uno/`. `<Route.Default/>` renders when no sibling route matched.

```jsx
import { render } from 'pota'
import { A, Route } from 'pota/components'

function App() {
	return (
		<main>
			<A href="/">Index</A>
			<Route path="/">
				<section>
					relative links: <A href="uno/">uno/</A> -{' '}
					<A href="dos/">dos/</A>
				</section>

				<Route>
					<h2>landing — matched / exactly</h2>
				</Route>
				<Route path="uno/">
					<h2>this is uno</h2>
					<Route.Default>nothing under uno/</Route.Default>
				</Route>
				<Route path="dos/">
					<h2>this is dos</h2>
				</Route>
			</Route>
		</main>
	)
}

render(App)
```

### Collapse to preserve state

`collapse` hides a route instead of unmounting it, avoiding a
re-render — useful for iframes, canvas, video, or audio that would
lose state on remount. The frame keeps playing as you navigate away
and back.

```jsx
import { render } from 'pota'
import { A, Route } from 'pota/components'

function App() {
	return (
		<main>
			<ul>
				<li>
					<A href="/#kilo/frame">frame</A>
				</li>
				<li>
					<A href="/#kilo/no-frame">no frame</A>
				</li>
			</ul>
			<Route path="/#">
				<Route path="kilo/">
					<Route
						path="frame"
						collapse={true}
					>
						<h3>frame stays alive</h3>
						<iframe
							width="560"
							height="315"
							src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
							title="frame"
							allowfullscreen
						/>
					</Route>
					<Route path="no-frame">
						<h3>no frame</h3>
					</Route>
				</Route>
			</Route>
		</main>
	)
}

render(App)
```
