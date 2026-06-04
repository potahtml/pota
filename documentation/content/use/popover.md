---
title: popover
subpath: pota/use/popover
topic: Floating UI
desc:
  Imperative floating popover controller anchored to a related
  element, with its own focus management.
---

# popover

`popover()` creates an imperative floating popover controller anchored
to a related element. Each call creates an _independent_ overlay
instance (unlike [tooltip](/use/tooltip), which shares one). Reach for
it when content is driven by async form flows, confirmations, or
validation handlers — not by pointer / focus refs.

The panel is rendered with `role="dialog"` and `tabindex="-1"`; focus
moves to it on open and is restored to the previously-focused element
on close (or on `dispose()` while open). It is built on
[overlay](/use/overlay), which owns the positioning, viewport
clamping, and arrow rendering.

## Arguments

`popover()` takes no arguments.

**Returns:** a controller object whose methods drive the overlay
imperatively.

| Method                  | Description                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `setRelated(node)`      | Set the anchor element (`Element \| null`).                            |
| `setContent(content)`   | Set the panel content (string, JSX, or any renderable value).          |
| `setPosition(position)` | Set the [position](/use/overlay) (`OverlayPosition`, default `'top'`). |
| `setArrows(arrows)`     | Toggle the arrow pointer (`boolean`, default `true`).                  |
| `open()`                | Show the panel (no-op after `dispose()`).                              |
| `close()`               | Hide the panel.                                                        |
| `dispose()`             | Tear down the overlay; restores focus if open. Idempotent.             |

## Controller API

```jsx
import { popover } from 'pota/use/popover'

const p = popover()

p.setRelated(anchor) // Element | null — the anchor
p.setContent(<div>Saved!</div>) // string | JSX | unknown
p.setPosition('bottom') // OverlayPosition
p.setArrows(false)

p.open()
p.close()
p.dispose() // when the controller is no longer needed
```

## When to use popover vs tooltip

- [tooltip](/use/tooltip) — hover/focus-driven, single shared
  instance, no focus management. Reach for it most of the time.
- `popover` — imperative; "save was successful" pulses, async
  confirmation prompts, form-validation panels, multi-step menus.
  Per-call instance, owns focus.

## Position values

Same set as [overlay](/use/overlay) — cardinals, plain corners,
overlap corners. Coordinates are clamped to the viewport (no
auto-flip).

## Examples

### Imperative confirmation popover

Wires a button to a `popover()` controller. The anchor is captured
with a ref, content and position are set imperatively, and the panel
is shown on click.

```jsx
import { render } from 'pota'
import { popover } from 'pota/use/popover'

function App() {
	const p = popover()

	let anchor
	const onSave = () => {
		p.setRelated(anchor)
		p.setContent(<div>Saved!</div>)
		p.setPosition('bottom')
		p.open()
	}

	return (
		<button
			use:ref={el => (anchor = el)}
			on:click={onSave}
		>
			Save
		</button>
	)
}

render(App)
```

### Toggling and disposing

Opens and closes the same controller, and disposes it when the
component unmounts. `dispose()` restores focus to the anchor if the
panel is still open.

```jsx
import { render, cleanup } from 'pota'
import { popover } from 'pota/use/popover'

function App() {
	const p = popover()
	p.setContent('Heads up!')
	p.setPosition('top')
	p.setArrows(false)

	cleanup(() => p.dispose())

	let anchor
	const toggle = () => {
		p.setRelated(anchor)
		p.open()
	}

	return (
		<>
			<button
				use:ref={el => (anchor = el)}
				on:click={toggle}
			>
				Show
			</button>
			<button on:click={() => p.close()}>Hide</button>
		</>
	)
}

render(App)
```
