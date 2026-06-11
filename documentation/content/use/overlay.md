---
title: overlay
subpath: pota/use/overlay
topic: Floating UI
desc:
  Low-level primitive for floating, anchored, reactively-positioned
  overlay panels.
---

# createOverlay

`createOverlay` is the shared primitive behind
[`tooltip`](/use/tooltip) and [`popover`](/use/popover) — the
low-level imperative API for floating, anchored, reactively-positioned
panels. Most code reaches for those instead.

You hand it a bag of accessor functions (it reads them reactively); it
mounts a wrap + panel into `document.body`, repositions on every
change, and tracks scroll and viewport resize for the lifetime of the
overlay. It returns a `dispose` that unmounts the overlay and releases
the shared stylesheet; `dispose` is idempotent.

Reach for `createOverlay` directly when you're building a new
floating-UI primitive (context menus, autocomplete dropdowns, etc.)
and need control over how state is wired.

## Arguments

| Argument      | Type                          | Description                                                              |
| ------------- | ----------------------------- | ------------------------------------------------------------------------ |
| `opened`      | `() => unknown`               | Truthy → the panel is visible.                                           |
| `related`     | `() => Element \| null`       | The anchor element the panel positions against.                          |
| `content`     | `() => unknown`               | Panel content. A string is whitespace-normalized (trimmed line-by-line). |
| `position`    | `() => OverlayPosition`       | Where to place the panel relative to the anchor. Defaults to `top`.      |
| `arrows`      | `() => unknown`               | Truthy → render the directional arrow.                                   |
| `role`        | `string` (optional)           | Panel `role` attribute. Defaults to `'dialog'`.                          |
| `ariaLabel`   | `() => string \| null` (opt.) | Override the `aria-label`. Defaults to the string content, if any.       |
| `manageFocus` | `boolean` (optional)          | Focus the panel on open, restore focus on close or dispose-while-open.   |

**Returns:** a `dispose` function that unmounts the overlay and
releases the shared stylesheet. Calling it more than once is a no-op.

## Positions

`OverlayPosition` includes cardinals (`top`, `bottom`, `left`,
`right`), plain corners (`top-left`, `top-right`, `bottom-left`,
`bottom-right`), and overlap corners where the matching edges align
(e.g. `top-left-overlap`).

Coordinates are clamped to the viewport — the panel will not render
beyond the visible window. Clamping is naive: it does _not_ flip the
requested position when the panel doesn't fit.

## manageFocus

When set, the panel gets `tabindex="-1"`, focus moves into it on open,
and is restored to the previously-focused element on close (or on
dispose-while-open). [`popover`](/use/popover) uses it; tooltips leave
it off so hover doesn't steal focus.

## Examples

### Toggle an anchored panel

Drives an overlay from a couple of signals: a button toggles `opened`,
and the panel anchors to that same button. Called during component
setup, the overlay's internal root attaches to the component's scope
and tears down with it — keep the returned `dispose` only when you
need to close the overlay early.

```jsx
import { render, signal } from 'pota'
import { createOverlay } from 'pota/use/overlay'

function App() {
	const opened = signal(false)
	const anchor = signal(null)

	createOverlay({
		opened: opened.read,
		related: anchor.read,
		content: () => 'Anchored panel',
		position: () => 'bottom',
		arrows: () => true,
	})

	return (
		<button
			use:ref={el => anchor.write(el)}
			on:click={() => opened.update(v => !v)}
		>
			Toggle
		</button>
	)
}

render(App)
```

### Focus-managed popover

Sets `manageFocus` so focus moves into the panel on open and is
restored to the trigger on close — the foundation for a dialog-like
floating panel.

```jsx
import { render, signal } from 'pota'
import { createOverlay } from 'pota/use/overlay'

function App() {
	const opened = signal(false)
	const anchor = signal(null)

	createOverlay({
		opened: opened.read,
		related: anchor.read,
		content: () => 'Press Tab — focus is trapped to me',
		position: () => 'bottom',
		arrows: () => true,
		role: 'dialog',
		manageFocus: true,
	})

	return (
		<button
			use:ref={el => anchor.write(el)}
			on:click={() => opened.update(v => !v)}
		>
			Open popover
		</button>
	)
}

render(App)
```
