---
title: Portal
kind: component
subpath: pota/components
topic: Document
desc:
  Inserts its children into a different element while keeping them in
  the current reactive scope.
---

# `<Portal/>`

Inserts its children into a different element while keeping them
inside the current reactive scope — no wrapper node is added. For
portaling into `document.head`, prefer [`<Head/>`](/components/Head),
which also deduplicates `title` / `meta` / `rel=canonical`.

Portaled content is rendered via `insert` and is owned by the
surrounding component: if that component is disposed, the portaled
nodes are removed too.

## Attributes

| name    | type      | description                                                    |
| ------- | --------- | -------------------------------------------------------------- |
| `mount` | `Element` | Element to portal into. The element should be in the document. |

## Examples

### Modal in an overlay

Renders its children into a host element instead of the surrounding
tree, while keeping context, ownership, and cleanup tied to the
component that declared it. Useful for tooltips, modals, and toasts —
anything that needs to escape the parent's overflow / z-index context.

```jsx
import { render, signal } from 'pota'
import { Portal, Show } from 'pota/components'

const overlay = document.createElement('div')
overlay.id = 'overlay'
document.body.append(overlay)

function App() {
	const open = signal(false)

	return (
		<div>
			<button on:click={() => open.update(o => !o)}>
				toggle modal
			</button>
			<Show when={open.read}>
				<Portal mount={overlay}>
					<div class="modal">
						<p>I'm rendered into #overlay.</p>
						<button on:click={() => open.write(false)}>close</button>
					</div>
				</Portal>
			</Show>
		</div>
	)
}

render(App)
```

### Toast queue

A toast container needs to escape any parent's `overflow: hidden` or
stacking context — `<Portal/>` projects each toast into a global host
element while keeping its lifecycle tied to the caller.

```jsx
import { render, signal } from 'pota'
import { For, Portal } from 'pota/components'

const host = document.createElement('div')
host.id = 'toasts'
host.style.cssText =
	'position:fixed;top:1rem;right:1rem;display:grid;gap:.5rem;z-index:9999'
document.body.append(host)

const toasts = signal([])
let nextId = 0

function notify(text) {
	const id = nextId++
	toasts.update(t => [...t, { id, text }])
	setTimeout(
		() => toasts.update(t => t.filter(x => x.id !== id)),
		2500,
	)
}

function App() {
	return (
		<div>
			<button on:click={() => notify('saved')}>saved</button>
			<button on:click={() => notify('uploaded')}>uploaded</button>

			<Portal mount={host}>
				<For each={toasts.read}>
					{t => (
						<div style="background:#222;color:#fff;padding:.5rem 1rem;border-radius:.25rem">
							{t.text}
						</div>
					)}
				</For>
			</Portal>
		</div>
	)
}

render(App)
```

### Portaling children without a wrapper

Portals can move text, elements, and nested components — without
adding any wrapper node. The siblings declared outside the portal stay
in place.

```jsx
import { render } from 'pota'
import { Portal } from 'pota/components'

function Test() {
	return ' me too!'
}

function Example() {
	return (
		<section class="escaping-this-parent">
			<Portal mount={document.body}>
				Portals can move text, elements and include their children.
				<br />
				Without any kind of wrapper.
				<Test />
			</Portal>
			I stay here
		</section>
	)
}

render(Example)
```
