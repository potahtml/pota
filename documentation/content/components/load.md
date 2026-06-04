---
title: load
subpath: pota/components
topic: Routing
desc: Lazy-load a route component via dynamic import, with retries.
---

# load

`load(() => import('./Page.js'))` returns a marked component that
fetches the module the first time it renders, rendering its default
export. On a network error it retries (up to nine times, waiting five
seconds between attempts); once the module commits it scrolls to the
URL hash, falling back to the `scroll` selectors of the enclosing
[`<Route>`](/components/Route). Most useful inside a `<Route>` so
heavy pages aren't paid for until visited.

## Arguments

| name        | type                            | description                                                             |
| ----------- | ------------------------------- | ----------------------------------------------------------------------- |
| `component` | `() => Promise<{ default: C }>` | an `import()` statement whose module's default export is the component. |

**Returns:** a marked component that resolves and renders the imported
module's default export, with retry and scroll handling built in.

## Examples

### Lazy-loaded route components

Each `load()` wraps a dynamic `import()` so a route's component is
only fetched when its path first matches.

```jsx
import { render } from 'pota'
import { A, Route, load } from 'pota/components'

const Settings = load(() => import('./pages/Settings.js'))
const Reports = load(() => import('./pages/Reports.js'))

function App() {
	return (
		<div>
			<nav>
				<A href="/settings">settings</A>
				{' · '}
				<A href="/reports">reports</A>
			</nav>

			<Route path="/settings">
				<Settings />
			</Route>
			<Route path="/reports">
				<Reports />
			</Route>
		</div>
	)
}

render(App)
```
