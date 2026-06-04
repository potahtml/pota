---
title: trapFocus
subpath: pota/use/focus
topic: Interaction
desc:
  use:ref function confining Tab navigation to an element's
  descendants.
---

# trapFocus

`trapFocus` confines `Tab` / `Shift+Tab` navigation to the focusable
descendants of the element — a standard accessibility need for modals,
popovers, and command palettes. It does nothing when the element has
no focusable descendants. Part of [`pota/use/focus`](/use/focus).

It installs its own `keydown` handler on the element: on each `Tab` it
queries the element's focusable descendants and, when focus is at a
boundary, prevents the default and wraps — `Tab` on the last element
focuses the first, `Shift+Tab` on the first focuses the last. This is
self-contained; it does not use the document-wide
[`focusNext`](/use/focus/focusNext) /
[`focusPrevious`](/use/focus/focusPrevious) helpers.

## Examples

### Modal-style Tab containment

Keep keyboard focus inside an open dialog, composed with
[`clickOutside`](/use/clickoutside) and
[`escape`](/use/clickoutside/escape) to dismiss it and
[`autoFocus`](/use/focus/autoFocus) to focus the first field.

```jsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'
import { autoFocus, trapFocus } from 'pota/use/focus'
import { clickOutside, escape } from 'pota/use/clickoutside'

function App() {
	const open = signal(false)
	const close = () => open.write(false)

	return (
		<div>
			<button on:click={() => open.write(true)}>open dialog</button>
			<Show when={open.read}>
				<div
					use:ref={[trapFocus, clickOutside(close), escape(close)]}
					style={{
						position: 'fixed',
						inset: '20% auto auto 30%',
						padding: '1rem 2rem',
						background: 'white',
						border: '1px solid #aaa',
					}}
				>
					<h3>Dialog</h3>
					<input
						use:ref={autoFocus}
						placeholder="first field"
					/>
					<input placeholder="second field" />
					<button on:click={close}>close</button>
				</div>
			</Show>
		</div>
	)
}

render(App)
```
