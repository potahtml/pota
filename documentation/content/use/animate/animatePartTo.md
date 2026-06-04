---
title: animatePartTo
subpath: pota/use/animate
topic: Animation
desc: Swap part tokens and resolve when the resulting animation ends.
---

# animatePartTo

`animatePartTo(element, oldPart, newPart)` is the `part` equivalent of
[`animateClassTo`](/use/animate/animateClassTo) — useful when styling
shadow-DOM custom elements from outside with `::part(...)` selectors.
It follows the same schedule → swap → await flow and resolves when the
animation ends (or immediately if none runs). Part of
[`pota/use/animate`](/use/animate).

## Arguments

| Argument  | Type      | Description                          |
| --------- | --------- | ------------------------------------ |
| `element` | `Element` | The element whose `part` tokens swap |
| `oldPart` | `string`  | The `part` token to remove           |
| `newPart` | `string`  | The `part` token to add              |

**Returns:** a `Promise` that resolves once the triggered animation
ends, or immediately if `element.getAnimations()` reports none.

## Examples

### Animate a part on click

Swaps a `part` token and waits for the resulting `::part(...)`
animation to finish before resetting it. The shadow tree exposes a
`box` part the page styles from outside.

```jsx
import { ref, render } from 'pota'
import { animatePartTo } from 'pota/use/animate'

function App() {
	const box = ref()

	const pulse = async () => {
		await animatePartTo(box(), 'idle', 'pulse')
		await animatePartTo(box(), 'pulse', 'idle')
	}

	return (
		<>
			<style>{`
				::part(box) {
					width: 120px;
					padding: 1rem;
					color: white;
					background: #2a9d8f;
				}
				::part(pulse) {
					animation: pulse .4s ease;
				}
				@keyframes pulse {
					50% { transform: scale(1.3); }
				}
			`}</style>

			<button on:click={pulse}>pulse</button>
			<div
				use:ref={box}
				part="box idle"
			>
				part box
			</div>
		</>
	)
}

render(App)
```
