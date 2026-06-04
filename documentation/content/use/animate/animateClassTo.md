---
title: animateClassTo
subpath: pota/use/animate
topic: Animation
desc: Swap classes and resolve when the resulting animation ends.
---

# animateClassTo

`animateClassTo(element, oldClass, newClass)` swaps CSS classes on an
element and returns a promise that resolves when the resulting CSS
animation finishes — or immediately, if none runs. Part of
[`pota/use/animate`](/use/animate); for `part` tokens use
[`animatePartTo`](/use/animate/animatePartTo).

## Arguments

| Argument   | Type      | Description                       |
| ---------- | --------- | --------------------------------- |
| `element`  | `Element` | The element whose classes to swap |
| `oldClass` | `string`  | The class to remove               |
| `newClass` | `string`  | The class to add                  |

**Returns:** a `Promise` that resolves once the triggered animation
ends, or immediately if `element.getAnimations()` reports none.

## How it works

1. Schedules the swap on `requestAnimationFrame` so the class change
   is observed by the next paint.
2. Removes `oldClass` and adds `newClass`.
3. If `element.getAnimations()` reports at least one running
   animation, waits for `animationend` on that element; otherwise
   resolves immediately — so it's safe to `await` when the swap may or
   may not produce a transition.

## Examples

### Fade between states

Chains class swaps, awaiting each animation before triggering the
next. Each `await` resolves on `animationend`, so the sequence stays
in step with the CSS.

```jsx
import { ref, render, signal } from 'pota'
import { animateClassTo } from 'pota/use/animate'

function App() {
	const box = ref()
	const state = signal('idle')

	const toggle = async () => {
		if (state.read() === 'idle') {
			state.write('out')
			await animateClassTo(box(), 'idle', 'out')
			state.write('back')
			await animateClassTo(box(), 'out', 'back')
			state.write('idle')
			await animateClassTo(box(), 'back', 'idle')
		}
	}

	return (
		<>
			<style>{`
				.idle { background: #2a9d8f; transition: background .2s; }
				.out  { background: #e76f51; animation: slide .4s forwards; }
				.back { background: #f4a261; animation: slide-back .4s forwards; }
				@keyframes slide       { to { transform: translateX(120px); } }
				@keyframes slide-back  { to { transform: translateX(0);     } }
			`}</style>

			<button on:click={toggle}>animate</button>
			<div
				use:ref={box}
				class={state.read}
				style={{
					width: '120px',
					padding: '1rem',
					color: 'white',
					'margin-top': '1rem',
				}}
			>
				state: {state.read}
			</div>
		</>
	)
}

render(App)
```
