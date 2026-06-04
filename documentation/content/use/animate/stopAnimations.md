---
title: stopAnimations
subpath: pota/use/animate
topic: Animation
desc:
  Cancel every animation running on an element; returns the canceled
  list.
---

# stopAnimations

`stopAnimations(element)` calls `.cancel()` on every animation
reported by `element.getAnimations()` — CSS animations, CSS
transitions, and Web Animations API instances — and returns the array
that was canceled. Useful before swapping classes so a previous
transition doesn't fight the new one. Part of
[`pota/use/animate`](/use/animate).

## Arguments

| Argument  | Type      | Description                            |
| --------- | --------- | -------------------------------------- |
| `element` | `Element` | The element whose animations to cancel |

**Returns:** the array of canceled `Animation` instances (the snapshot
from `element.getAnimations()`). Each has a `.finished` promise —
`await Promise.all(list.map(a => a.finished.catch(() => 0)))` to wait
for the cancellations to settle.

## Examples

### Cancel before re-triggering

Stops any in-flight animation, then re-adds the class to restart it
from a clean state. Without the cancel, re-adding a class that is
already present would not re-fire the animation.

```jsx
import { ref, render } from 'pota'
import { stopAnimations } from 'pota/use/animate'

function App() {
	const box = ref()

	const restart = () => {
		stopAnimations(box())
		box().classList.remove('pulse')
		// force reflow so the re-add re-triggers the animation
		void box().offsetWidth
		box().classList.add('pulse')
	}

	return (
		<>
			<style>{`
				.box {
					width: 120px;
					padding: 1rem;
					color: white;
					background: #2a9d8f;
				}
				.pulse { animation: pulse 1s ease; }
				@keyframes pulse { 50% { transform: scale(1.3); } }
			`}</style>

			<button on:click={restart}>restart</button>
			<div
				use:ref={box}
				class="box pulse"
			>
				box
			</div>
		</>
	)
}

render(App)
```
