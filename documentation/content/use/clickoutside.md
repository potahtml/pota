---
title: clickOutside
subpath: pota/use/clickoutside
topic: Interaction
desc: Fire a callback on a click outside an element, or on Escape.
---

# `pota/use/clickoutside`

`pota/use/clickoutside` dismisses things when interaction moves away:
`clickOutside` fires when a pointer event lands outside an element,
and [`escape`](/use/clickoutside/escape) fires when the user presses
Escape — handy for menus, popovers, and dialogs. Both are ref
factories: attach them with `use:ref`.

## Exports

- `clickOutside(handler, options?)` — ref factory firing on a
  `pointerdown` outside the element (documented below)
- [`escape(handler)`](/use/clickoutside/escape) — ref factory firing
  on the Escape key

## Arguments

`clickOutside(handler, options?)`

| Argument       | Type                                       | Description                                         |
| -------------- | ------------------------------------------ | --------------------------------------------------- |
| `handler`      | `(e: PointerEvent, node: Element) => void` | Called when a `pointerdown` lands outside the node. |
| `options.once` | `boolean`                                  | When `true`, detach after the first match.          |

**Returns:** a ref function `(node: Element) => void` for `use:ref`.

## Examples

### Close a popover on outside click

The handler runs whenever a `pointerdown` lands outside the element
it's attached to. Cleanup is automatic: the listener is bound to the
element's reactive scope and detaches when the element unmounts.

```jsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'
import { clickOutside } from 'pota/use/clickoutside'

function App() {
	const open = signal(false)

	return (
		<div>
			<button on:click={() => open.write(true)}>open</button>
			<Show when={open.read}>
				<div use:ref={clickOutside(() => open.write(false))}>
					<p>I close on outside click.</p>
				</div>
			</Show>
		</div>
	)
}

render(App)
```

## Notes

- `clickOutside` listens for `pointerdown` on `document`. "Outside"
  means `!node.contains(event.target)`, so clicks on descendants
  (including portals rendered inside the node) don't fire.
- Pass `{ once: true }` for single-shot dismissal — the listener
  auto-removes after the first match:
  `clickOutside(handler, { once: true })`.
- Compose multiple factories on one element:
  `use:ref={[clickOutside(a), escape(b)]}`.
