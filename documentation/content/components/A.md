---
title: A
kind: component
subpath: pota/components
topic: Routing
desc:
  Anchor that intercepts clicks for client-side Route navigation, with
  param substitution.
---

# `<A/>`

Anchor that intercepts clicks for client-side
[`<Route>`](/components/Route) navigation. Renders a regular `<a>` but
resolves its `href` relative to the current route — when `href` is not
absolute (doesn't start with `/` and carries no `scheme://` protocol)
it is resolved against the route the link sits in. Hash hrefs (`#…`)
resolve relative too, which is what makes hash routing work.

Use `params` to substitute `:name` placeholders in `href` with their
URI-encoded values, and `replace` to swap the current history entry
instead of pushing a new one. Pair with [`load`](/components/load) to
lazy-load the pages a link points to.

## Attributes

| name       | type                     | description                                                                                                  |
| ---------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `href`     | `string`                 | target URL; resolved relative to the current route when not absolute                                         |
| `params?`  | `Record<string, string>` | replaces `:name` placeholders in `href` with their URI-encoded values; unmatched placeholders are left as-is |
| `replace?` | `boolean`                | replace the current history entry instead of pushing a new one (default `false`)                             |

All other props (`class`, `target`, `on:click`, …) are forwarded to
the underlying `<a>`.

## Examples

### Route-aware link

A small nav whose links drive client-side navigation. `params`
substitutes `:id` in the `href`, and `replace` swaps history instead
of pushing a new entry.

```jsx
import { render } from 'pota'
import { A, Route } from 'pota/components'

function App() {
	return (
		<div>
			<nav>
				<A href="/">home</A>
				{' · '}
				<A
					href="/users/:id"
					params={{ id: '7' }}
				>
					user 7
				</A>
				{' · '}
				<A
					href="/about"
					replace
				>
					about (replace)
				</A>
			</nav>

			<Route path="/users/:id">
				<p>user page</p>
			</Route>
		</div>
	)
}

render(App)
```

### Param substitution and encoding

`params` URI-encodes the values it substitutes, so accented or special
characters survive in the resolved `href`. Placeholders with no
matching key are left untouched.

```jsx
import { render } from 'pota'
import { A } from 'pota/components'

function App() {
	return (
		<ul>
			<li>
				<A
					href="/:cat/:page"
					params={{ cat: 'variété', page: 'touché' }}
				>
					/vari%C3%A9t%C3%A9/touch%C3%A9
				</A>
			</li>
			<li>
				<A
					href="#:cat/:page"
					params={{ cat: 'variété', page: 'touché' }}
				>
					hash link
				</A>
			</li>
			<li>
				<A
					href=":nope"
					params={{ page: 'touché' }}
				>
					:nope (no matching key — left as-is)
				</A>
			</li>
		</ul>
	)
}

render(App)
```
