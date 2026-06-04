---
title: readyAsync
subpath: pota
topic: Renderer
desc:
  Schedule a callback to run once every tracked async task has
  settled.
---

# readyAsync

`readyAsync(fn)` waits for any tracked async work (promises inside
[`derived`](/derived) / `withValue` / etc.) to complete before firing.
Useful when you need a snapshot of the world _after_ everything has
loaded — common in tests or in screenshot / printing flows. For the
synchronous form see [`ready`](/ready).

A pending async task increments an internal counter; `readyAsync`
callbacks fire only once that counter reaches zero, so several
in-flight tasks all settle before the callback runs. If new async work
is still outstanding when the queue drains, the callbacks stay queued
until everything settles.

## Arguments

| name | type | description                                         |
| ---- | ---- | --------------------------------------------------- |
| `fn` | fn   | function to run once all tracked async work settles |

## Examples

### Snapshot after fetching

Logs only after the tracked `fetch` inside `derived` has resolved.

```jsx
import { derived, readyAsync, render, signal } from 'pota'

function App() {
	const id = signal(1)

	const post = derived(
		() =>
			fetch(
				`https://jsonplaceholder.typicode.com/posts/${id.read()}`,
			),
		res => res.json(),
	)

	readyAsync(() => {
		console.log('all async settled — post is', post())
	})

	return <p>{() => post()?.title ?? 'loading…'}</p>
}

render(App)
```
