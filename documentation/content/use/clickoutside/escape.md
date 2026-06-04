---
title: escape
subpath: pota/use/clickoutside
topic: Interaction
desc: Ref factory that fires a callback on the Escape key.
---

# escape

`escape(handler)` is a ref factory from
[`pota/use/clickoutside`](/use/clickoutside) that calls `handler` when
the user presses Escape. It listens for `keydown` on `document` and
fires only when `e.key === 'Escape'`. The element itself is passed to
the handler so one closure can serve several elements. Attach it with
`use:ref`, and compose it with other factories such as
[`clickOutside`](/use/clickoutside):
`use:ref={[clickOutside(a), escape(b)]}`.

## Arguments

| Argument  | Type                                        | Description                            |
| --------- | ------------------------------------------- | -------------------------------------- |
| `handler` | `(e: KeyboardEvent, node: Element) => void` | Called when the Escape key is pressed. |

**Returns:** a ref function `(node: Element) => void` for `use:ref`.

## Examples

### Dismiss on outside click or Escape

Compose `escape` with [`clickOutside`](/use/clickoutside) for the
standard "close-on-outside-click or Escape" dismissal pattern — both
ref factories share one element.

```jsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'
import { clickOutside, escape } from 'pota/use/clickoutside'

function App() {
	const open = signal(false)
	const close = () => open.write(false)

	return (
		<div>
			<button on:click={() => open.write(true)}>open</button>
			<Show when={open.read}>
				<div
					use:ref={[clickOutside(close), escape(close)]}
					style={{
						position: 'fixed',
						inset: '30% auto auto 30%',
						padding: '1rem 2rem',
						background: 'white',
						border: '1px solid #aaa',
					}}
				>
					<p>click outside, or press Escape, to dismiss.</p>
				</div>
			</Show>
		</div>
	)
}

render(App)
```
