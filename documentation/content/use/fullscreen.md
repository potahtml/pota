---
title: fullscreen
subpath: pota/use/fullscreen
topic: Browser
desc:
  Toggle and observe fullscreen — a ref factory plus reactive and
  imperative forms.
---

# `pota/use/fullscreen`

`fullscreen(target?)` returns a ref function that toggles fullscreen
on click. With no argument the element it's attached to goes
fullscreen; pass an element, or a function returning one, to target
something else (e.g. a button that fullscreens a nearby `<video>`).
The module also exposes reactive and imperative forms.

## Exports

- `fullscreen(target?)` — ref factory: toggle fullscreen on click
  (documented below)
- [`isFullscreen()`](/use/fullscreen/isFullscreen) — current
  fullscreen element (or `null`)
- [`useFullscreen()`](/use/fullscreen/useFullscreen) — reactive signal
  accessor of the fullscreen element
- [`onFullscreen(fn)`](/use/fullscreen/onFullscreen) — callback on
  fullscreen change
- [`requestFullscreen(element)`](/use/fullscreen/requestFullscreen) /
  [`exitFullscreen()`](/use/fullscreen/exitFullscreen) — imperative
- [`toggleFullscreen(element?)`](/use/fullscreen/toggleFullscreen) —
  toggle; defaults to `documentElement`

## Arguments

`fullscreen` (the ref factory):

| Argument | Type                                                                | Description                                                                                  |
| -------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `target` | `DOMElement \| ((e: PointerEvent, node: DOMElement) => DOMElement)` | Optional. Element to fullscreen, or a function returning one. Defaults to the attached node. |

**Returns:** a ref function `(node) => void` for `use:ref` that
toggles fullscreen on click.

## Examples

### Toggle fullscreen on a stage

`fullscreen()` toggles the element itself; pass a function to choose a
different target (here it fullscreens a sibling stage element). The
[`useFullscreen()`](/use/fullscreen/useFullscreen) accessor reports
the current fullscreen element (or `null`).

```jsx
import { ref, render } from 'pota'
import { fullscreen, useFullscreen } from 'pota/use/fullscreen'

function App() {
	const stage = ref()
	const current = useFullscreen()

	return (
		<div>
			<button use:ref={fullscreen(() => stage())}>
				toggle fullscreen
			</button>
			<div
				use:ref={stage}
				style={{
					background: 'rebeccapurple',
					color: 'white',
					padding: '2rem',
				}}
			>
				stage — fullscreen target
			</div>
			<p>currently fullscreen: {() => (current() ? 'yes' : 'no')}</p>
		</div>
	)
}

render(App)
```

### Target the element itself

With no argument `fullscreen()` fullscreens the element it's attached
to; passing `(event, node) => node` is the explicit equivalent.

```jsx
import { render } from 'pota'
import { fullscreen } from 'pota/use/fullscreen'

function App() {
	return (
		<main>
			<section>
				<div use:ref={fullscreen()}>fullscreen body</div>
				<div use:ref={fullscreen((event, node) => node)}>
					fullscreen element
				</div>
			</section>
		</main>
	)
}

render(App)
```
