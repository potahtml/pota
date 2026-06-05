---
title: navigate
subpath: pota/use/location
topic: Routing
desc: Navigate the current location programmatically.
---

# navigate

`navigate(href, options?)` changes the current location
programmatically. The component [`<Navigate>`](/components/Navigate)
is a JSX wrapper around the same function, for when you want to
redirect declaratively from inside a route. Part of
[`pota/use/location`](/use/location).

## Arguments

| name       | type                   | description                                                                                                                                                                                                                              |
| ---------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `href`     | url                    | When the `href` is not absolute (i.e. starting with `/`, `#` or `http`) it will navigate relative to `window.location.href`.                                                                                                             |
| `params?`  | key-value pairs object | used to replace params in the href for the URI encoded equivalents. `<Navigate href="/some/:cat/:page" params={{ cat: 'variété', page: 'touché' }}/>` will navigate to `/some/vari%C3%A9t%C3%A9/touch%C3%A9`. Same with `navigate(...)`. |
| `replace?` | `boolean [false]`      | replace the current browser history entry instead of pushing a new one                                                                                                                                                                   |
| `scroll?`  | `boolean [true]`       | scroll to the target hash (or top of the page) after navigating                                                                                                                                                                          |
| `delay?`   | `number`               | milliseconds to wait before navigating; the navigation is deferred via a timeout. Omit for immediate navigation.                                                                                                                         |

## Examples

### Navigate programmatically

Calls `navigate` from an event handler, replacing the `:cat` / `:page`
segments via `params` and skipping the scroll. `delay` defers the jump
so a transition or message can play first.

```jsx
import { render } from 'pota'
import { navigate } from 'pota/use/location'

function App() {
	return (
		<div>
			<button
				on:click={() =>
					navigate('/somewhere/:cat/:page', {
						params: { cat: 'variété', page: 'touché' },
						scroll: false,
					})
				}
			>
				go now
			</button>
			<button on:click={() => navigate('/home', { delay: 2000 })}>
				go home in 2s
			</button>
		</div>
	)
}

render(App)
```

### `<Navigate>` tag

Redirects declaratively from inside a route — rendering `<Navigate>`
triggers the same navigation, here replacing the history entry so the
redirect leaves no back-button trace.

```jsx
import { render } from 'pota'
import { Navigate, Route } from 'pota/components'

function App() {
	return (
		<Route path="/old">
			<Navigate
				path="/somewhere/:cat/:page"
				params={{ cat: 'variété', page: 'touché' }}
				replace={true}
			/>
		</Route>
	)
}

render(App)
```
