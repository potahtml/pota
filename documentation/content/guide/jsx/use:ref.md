---
title: use:ref
subpath: pota
topic: Lifecycles
desc:
  Get a reference to an element via a signal, or attach one or more
  ref factories.
---

# `use:ref`

`use:ref` hands you a reference to the element. Its value is a
function that receives the element, or an array (any depth) of such
functions when more than one consumer needs the handle. The canonical
producer is [ref](/ref), a tiny signal-function: call `r(node)` to
write, `r()` to read — so the reference works inside effects and
memos.

The ref is written as soon as the element is created, _before_ it is
inserted into the document (static children are already cloned in;
dynamic expression children fill in after). Layout-dependent
properties like `clientWidth` therefore return `0` at ref time. For work that needs the element connected, run it inside
[ready](/ready) or use [use:connected](/guide/jsx/use:connected).

Because the value is just a function `(node) => void`, the same
attribute also attaches **ref factories** — this is how the built-in
[pota/use/\*](/use/clickoutside) helpers wire behavior onto an element
without a plugin registry.

## Arguments

| name    | type                       | description                                                        |
| ------- | -------------------------- | ------------------------------------------------------------------ |
| `value` | `fn` \| `fn[]` (any depth) | function(s) called synchronously with the element at creation time |

Each function runs in array order, synchronously, at element creation
— before the element is inserted into the document.

## Examples

### Read a ref in an effect

`ref()` returns a signal-function the renderer assigns synchronously
at element creation; reading `button()` inside an effect re-runs when
it is written.

```jsx
import { effect, ref, render, signal } from 'pota'

function App() {
	const button = ref()
	const log = signal('')

	effect(() => {
		if (button()) {
			log.write(`button: ${button().tagName}`)
		}
	})

	return (
		<div>
			<button
				name="button"
				use:ref={button}
				on:click={() => log.write(`clicked: ${button().tagName}`)}
			>
				button
			</button>
			<p>{log.read}</p>
		</div>
	)
}

render(App)
```

### Focus on mount

Imperative work that requires the node to be in the DOM (focus,
measure, integrate a third-party widget) belongs inside
[ready](/ready), which fires once the renderer has mounted everything.

```jsx
import { ready, ref, render } from 'pota'

function App() {
	const input = ref()

	ready(() => input().focus())

	return (
		<div>
			<label>type here:</label>
			<input use:ref={input} />
		</div>
	)
}

render(App)
```

### Ref at mount time

`use:ref` writes the reference at element creation, before the node is
connected. To have the reference land at _mount_ time instead, pass
the same ref signal to [use:connected](/guide/jsx/use:connected) — it
takes the same signal-as-callback and fires once the element is in the
document, so `button()` reads a connected node.

```jsx
import { effect, ref, render, signal } from 'pota'

function App() {
	const button = ref()
	const log = signal('')

	effect(() => {
		if (button()) log.write(`connected: ${button().tagName}`)
	})

	return (
		<div>
			<button
				use:connected={button}
				on:click={() => log.write(`clicked: ${button().tagName}`)}
			>
				button
			</button>
			<p>{log.read}</p>
		</div>
	)
}

render(App)
```

### Multiple refs on one element

`use:ref` accepts a single ref or an array — every entry receives the
element. Useful when one place creates the element and another (a
parent component, an external library wrapper) also needs a handle.
Both refs read the same node.

```jsx
import { ready, ref, render, signal } from 'pota'

function App() {
	const localRef = ref()
	const externalRef = ref()
	const log = signal('')

	ready(() => {
		log.write(
			`local sees ${localRef().tagName}, external sees ${externalRef().tagName}, same node? ${localRef() === externalRef()}`,
		)
	})

	return (
		<div>
			<input
				use:ref={[localRef, externalRef]}
				placeholder="bound to two refs"
			/>
			<p>{log.read}</p>
		</div>
	)
}

render(App)
```

### Composable behaviors (ref factories)

Anything that's a function `(node) => void` works as a ref. To
parameterize a behavior, write a factory that returns one. This is how
the built-in `pota/use/*` helpers ([clickOutside](/use/clickoutside),
[clipboard](/use/clipboard), [fullscreen](/use/fullscreen), …) are
built — and how you add your own without a plugin registry. Cleanup is
automatic: [addEvent](/addEvent), [cleanup](/cleanup), and
`use:connected` inside a ref body all dispose with the element.

```jsx
import { addEvent, cleanup, render } from 'pota'

const longPress =
	(handler, ms = 600) =>
	node => {
		let timer
		const start = () => {
			timer = setTimeout(handler, ms)
		}
		const stop = () => clearTimeout(timer)

		addEvent(node, 'pointerdown', start)
		addEvent(node, 'pointerup', stop)
		addEvent(node, 'pointerleave', stop)

		cleanup(stop)
	}

function App() {
	return (
		<button use:ref={longPress(() => alert('long pressed!'))}>
			hold me
		</button>
	)
}

render(App)
```

### Composing many factories

Pass an array (any depth) of refs — every entry receives the element,
in array order, synchronously at creation. Mix bare functions with
factories from `pota/use/*`.

```jsx
import { ready, render, signal } from 'pota'
import { clickOutside } from 'pota/use/clickoutside'
import { preventEnter } from 'pota/use/form'

const autoFocus = node => ready(() => node.focus())

function App() {
	const log = signal('')

	const logMount = label => node =>
		log.write(`${label} attached: ${node.tagName}`)

	return (
		<div>
			<input
				use:ref={[
					autoFocus,
					preventEnter,
					clickOutside(() => log.write('clicked outside')),
					logMount('input'),
				]}
				placeholder="type here"
			/>
			<p>{log.read}</p>
		</div>
	)
}

render(App)
```
