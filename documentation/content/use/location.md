---
title: location
subpath: pota/use/location
topic: Routing
desc: Reactive location data and client-side navigation.
---

# `pota/use/location`

`pota/use/location` exposes the current URL as a reactive `location`
object plus the navigation helpers that drive pota's router:
[`navigate`](/use/location/navigate) (and its declarative
[`<Navigate>`](/components/Navigate) wrapper),
[`navigateSync`](/use/location/navigateSync), the
[`useBeforeLeave`](/use/location/useBeforeLeave) guard, and
[`addListeners`](/use/location/addListeners) to wire up `popstate` /
click handling.

## Exports

- `location` — reactive object of URL accessors (documented below)
- [`navigate(href, options?)`](/use/location/navigate) — navigate
  programmatically
- [`navigateSync(href, options?)`](/use/location/navigateSync) —
  synchronous navigation, for tests
- [`useBeforeLeave(fn)`](/use/location/useBeforeLeave) — guard that
  can cancel navigation
- [`addListeners()`](/use/location/addListeners) — wire up `popstate`
  / click handlers

## location

`location` is a frozen object. Most of its members are [`memo`](/memo)
accessors — call them as zero-arg functions (`location.pathname()`) to
read the current value reactively. They are **not** signals: there is
no `.read()` / `.write()` and you cannot assign to them; use
[`navigate`](/use/location/navigate) to change the URL.

`protocol` and `origin` are the exception — they are plain strings
captured **once** at module init and never update. Treat them as
constants, not as reactive accessors.

### Properties

| name           | type             | description                                                          |
| -------------- | ---------------- | -------------------------------------------------------------------- |
| `protocol`     | string           | `window.location.protocol`, captured once at init — **not reactive** |
| `origin`       | string           | `window.location.origin`, captured once at init — **not reactive**   |
| `href`         | accessor `() =>` | reactive `window.location.href`                                      |
| `pathname`     | accessor `() =>` | reactive `window.location.pathname`                                  |
| `path`         | accessor `() =>` | reactive `pathname()` + `hash()`                                     |
| `hash`         | accessor `() =>` | reactive `window.location.hash`, normalized to `'#'` when empty      |
| `search`       | accessor `() =>` | reactive `window.location.search`                                    |
| `searchParams` | reactive map     | URI-decoded `searchParams`, e.g. `{ search: 'variété' }`             |
| `params`       | reactive map     | URI-decoded Route `params` getter, e.g. `{ page: 'variété' }`        |

`params` is a getter: each access builds a fresh effect + reactive map
owned by the current scope. Capture it once at component setup
(`const params = location.params`) and read keys from that — do not
call `location.params` inline inside a reactive expression, and only
call it inside an owner scope.

## Examples

### Read and navigate the URL

`location` is a frozen object of accessors over `window.location` —
read `location.pathname()`, `location.hash()`, `location.search()`, or
the reactive `location.searchParams` map.
[`navigate(path, options)`](/use/location/navigate) performs
client-side navigation; [`addListeners()`](/use/location/addListeners)
ensures `popstate` / click handlers are wired up.

```jsx
import { addListeners, location, navigate } from 'pota/use/location'
import { render } from 'pota'

addListeners()

function App() {
	return (
		<div>
			<p>path: {location.pathname}</p>
			<p>hash: {location.hash}</p>
			<button on:click={() => navigate('/about')}>
				go to /about
			</button>
			<button on:click={() => navigate('/users/42')}>
				go to /users/42
			</button>
		</div>
	)
}

render(App)
```

### Inspect every accessor inside a route

Renders each `location` accessor live and navigates to a URL with a
path, query string, and hash so all of them update at once.
`searchParams` is wrapped in `{() => …}` because `JSON.stringify`
reads it once per render — the function makes that read reactive.

```jsx
import { render } from 'pota'
import { Route } from 'pota/components'

import { location, navigate } from 'pota/use/location'

function Example() {
	return (
		<main>
			<Route path="/:page">
				<ul>
					<li>pathname: {location.pathname}</li>
					<li>path: {location.path}</li>
					<li>hash: {location.hash}</li>
					<li>search: {location.search}</li>
					<li>
						searchParams:{' '}
						{() => JSON.stringify(location.searchParams)}
					</li>
					<li>href: {location.href}</li>
				</ul>
				<button
					on:click={() => navigate('/page?q=variété&page=2#section')}
				>
					navigate
				</button>
			</Route>
		</main>
	)
}

render(Example)
```

### Read route params

`location.params` is a getter — capture it once at setup, then read
keys from the returned reactive map. The `:cat` / `:page` segments of
the matched route are URI-decoded for you.

```jsx
import { render } from 'pota'
import { Route } from 'pota/components'

import { location, navigate } from 'pota/use/location'

function Catalog() {
	const params = location.params

	return (
		<div>
			<p>cat: {() => params.cat}</p>
			<p>page: {() => params.page}</p>
			<button on:click={() => navigate('/catalog/variété/touché')}>
				go
			</button>
		</div>
	)
}

function App() {
	return (
		<Route path="/catalog/:cat/:page">
			<Catalog />
		</Route>
	)
}

render(App)
```
