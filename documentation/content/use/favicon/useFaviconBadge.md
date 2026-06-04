---
title: useFaviconBadge
subpath: pota/use/favicon
topic: Browser
desc: Reactive favicon badge — redraws when the value changes.
---

# useFaviconBadge

Keeps the favicon badge in sync with a reactive value: pass an
accessor (or a signal's `.read`) and the favicon updates whenever the
value changes; a static value applies once. It is the reactive driver
for [`setFaviconBadge`](/use/favicon/setFaviconBadge).

It does _not_ clear the badge on scope dispose — favicons are
page-global state, so call
[`setFaviconBadge(null)`](/use/favicon/setFaviconBadge) from your own
cleanup if you want it gone. See [`pota/use/favicon`](/use/favicon)
for options.

## Arguments

| name       | type                                                   | description                                                            |
| ---------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `badge`    | `string \| number \| null \| undefined \| (() => any)` | reactive accessor (redraws on change) or a static value (applied once) |
| `options?` | `{ background?: string; color?: string }`              | badge fill color (default `'red'`) and text color (default `'white'`)  |

## Examples

### Track an unread count

Drives the favicon badge from a signal — clicking the button bumps the
count and the tab icon redraws. Passing `null` once the count is zero
shows the plain icon.

```jsx
import { render, signal } from 'pota'
import { useFaviconBadge } from 'pota/use/favicon'

function App() {
	const unread = signal(0)

	useFaviconBadge(() => unread.read() || null, {
		background: '#0a84ff',
	})

	return (
		<button on:click={() => unread.update(n => n + 1)}>
			Mark unread ({unread.read})
		</button>
	)
}

render(App)
```
