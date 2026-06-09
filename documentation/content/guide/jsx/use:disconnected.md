---
title: use:disconnected
subpath: pota
topic: Lifecycles
desc: Run a callback just before the element leaves the document.
---

# `use:disconnected`

Element attribute that runs its callback just before the element is
removed from the document. Useful for tearing down non-reactive
subscriptions tied to the live DOM — for reactive-scope teardown,
prefer [cleanup](/cleanup). Accepts a single callback or an array of
callbacks; each receives the element.

The callback is registered as a [cleanup](/cleanup) on the surrounding
reactive scope, so it fires when that scope disposes — when the
component unmounts or its owning [render](/render) call is disposed.

## Arguments

| name    | type                       | description                                                   |
| ------- | -------------------------- | ------------------------------------------------------------- |
| `value` | `fn` \| `fn[]` (any depth) | function(s) called with the element just before it is removed |

## Examples

### Tear down on unmount

The callback runs just before the element leaves the document — a good
place to detach a non-reactive subscription bound to the live node.

```jsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'

function App() {
	const show = signal(true)
	const log = signal('')

	return (
		<div>
			<button on:click={() => show.update(v => !v)}>
				mount / unmount
			</button>
			<Show when={show.read}>
				<main
					use:disconnected={node => {
						log.write(`${node.tagName} about to unmount`)
					}}
				>
					Content
				</main>
			</Show>
			<p>{log.read}</p>
		</div>
	)
}

render(App)
```

### Fires when the scope disposes

Disposing the [render](/render) call disposes the owning scope, which
runs the registered cleanup — so the `use:disconnected` callback
fires.

```jsx
import { render, signal } from 'pota'

const log = signal('')

function App() {
	return (
		<main
			use:disconnected={node => log.write(`${node.tagName} disposed`)}
		>
			Content
		</main>
	)
}

const dispose = render(App)

// the log lives outside the disposed tree, so it survives to show
// the message
render(
	<div>
		<button on:click={dispose}>dispose</button>
		<p>{log.read}</p>
	</div>,
)
```
