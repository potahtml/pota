---
title: tooltip
subpath: pota/use/tooltip
topic: Floating UI
desc:
  Ref factory showing a singleton tooltip on hover or focus, hiding on
  leave or blur.
---

# tooltip

`tooltip` is a ref factory that shows a singleton tooltip when its
element is hovered (`pointerenter`) or focused, and hides it on
`pointerleave` or `blur`. Only one tooltip is visible at a time —
activating a different trigger replaces the active one, matching how
OS-native tooltips behave. Attach it with `use:ref`.

A single shared overlay (see [overlay](/use/overlay)) backs every
`tooltip(...)` call. The overlay is refcounted: it appears on the
first tooltip mount and is removed when the last ref disposes. It
auto-repositions on scroll and viewport resize.

## Arguments

`tooltip(opts)` takes a single options object.

| name        | type                               | description                                                                                                       |
| ----------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `content`   | string \| JSX \| function/accessor | tooltip body. Reactive when given a function or signal reader — the visible tooltip updates as the value changes. |
| `position?` | OverlayPosition                    | where the panel sits relative to the trigger; defaults to `'top'`. See [overlay](/use/overlay) for the full list. |
| `arrows?`   | boolean                            | toggles the arrow indicator on the panel; defaults to `true`.                                                     |

**Returns:** a ref function `(node) => void` to attach via `use:ref`.

## Positions

`position` accepts any [`OverlayPosition`](/use/overlay):

- **Cardinals** (panel adjacent, centered on the trigger): `top`
  (default), `bottom`, `left`, `right`.
- **Plain corners** (panel diagonally past the trigger's corner):
  `top-left`, `top-right`, `bottom-left`, `bottom-right`.
- **Overlap corners** (panel adjacent on one axis, matching edges
  aligned): `top-left-overlap`, `top-right-overlap`,
  `bottom-left-overlap`, `bottom-right-overlap`.

## Examples

### Basic tooltip

A static string tooltip on a button, shown on hover or keyboard focus.

```jsx
import { render } from 'pota'
import { tooltip } from 'pota/use/tooltip'

function App() {
	return (
		<button use:ref={tooltip({ content: 'Save the document' })}>
			Save
		</button>
	)
}

render(App)
```

### Reactive content and position

Pass a reader function for `content` so the visible tooltip updates as
the value changes. Here it also picks an alternative `position` and
hides the arrow.

```jsx
import { render, signal } from 'pota'
import { tooltip } from 'pota/use/tooltip'

function App() {
	const unread = signal(3)

	return (
		<a
			use:ref={tooltip({
				content: () => unread.read() + ' unread',
				position: 'bottom-right',
				arrows: false,
			})}
		>
			Inbox
		</a>
	)
}

render(App)
```

### Composing with other refs

Compose a tooltip with another behavior by passing an array of ref
factories to `use:ref`.

```jsx
import { render } from 'pota'
import { tooltip } from 'pota/use/tooltip'
import { clickOutside } from 'pota/use/clickoutside'

function App() {
	const cancel = () => console.log('cancelled')

	return (
		<button
			use:ref={[
				tooltip({ content: 'Click outside to cancel' }),
				clickOutside(cancel),
			]}
		>
			Confirm
		</button>
	)
}

render(App)
```
