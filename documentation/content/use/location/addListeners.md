---
title: addListeners
subpath: pota/use/location
topic: Routing
desc:
  Wire up the popstate / hashchange / click handlers for client-side
  navigation.
---

# addListeners

`addListeners()` adds the event listeners for client-side navigation —
a delegated `click` handler plus `hashchange` and `popstate`. It only
adds them once, so calling it repeatedly is safe and never duplicates
handlers. Call it during app setup before relying on
[`location`](/use/location) or [`navigate`](/use/location/navigate).
Part of [`pota/use/location`](/use/location).

## Examples

### Enable navigation at startup

Call `addListeners()` once during app setup so in-app `<a>` clicks and
the browser back/forward buttons drive client-side navigation instead
of full page loads.

```jsx
import { addListeners, location } from 'pota/use/location'
import { render } from 'pota'

addListeners()

function App() {
	return (
		<nav>
			<a href="/about">about</a>
			<a href="/contact">contact</a>
			<p>current path: {location.pathname}</p>
		</nav>
	)
}

render(App)
```
