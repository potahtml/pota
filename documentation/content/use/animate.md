---
title: animate
subpath: pota/use/animate
topic: Animation
desc:
  Promise-returning class/part swaps, plus rAF and animation
  utilities.
---

# `pota/use/animate`

`pota/use/animate` swaps CSS classes (or `part` tokens) on an element
and returns a promise that resolves when the resulting CSS animation
finishes — or immediately, if no animation is running. Useful for
chaining state changes after an `enter` / `exit` transition without
watching `animationend` by hand. It also bundles a few animation
utilities: cancel running animations, introspect `@keyframes`, and an
owned `requestAnimationFrame` loop.

## Exports

- [`animateClassTo(el, oldClass, newClass)`](/use/animate/animateClassTo)
  — swap classes; resolves when the animation ends
- [`animatePartTo(el, oldPart, newPart)`](/use/animate/animatePartTo)
  — same, for `part` tokens
- [`stopAnimations(el)`](/use/animate/stopAnimations) — cancel every
  running animation; returns them
- [`documentKeyframes()`](/use/animate/documentKeyframes) — map of
  every `@keyframes` rule by name
- [`useAnimationFrame(fn)`](/use/animate/useAnimationFrame) — owned
  rAF loop with `{ start, stop }`

## Examples

### Await a class swap

[`animateClassTo`](/use/animate/animateClassTo) swaps classes and
resolves on `animationend`, so state changes can be chained without
watching the event by hand. It resolves immediately when no animation
runs, making it safe to `await` either way.

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
			state.write('idle')
			await animateClassTo(box(), 'out', 'idle')
		}
	}

	return (
		<>
			<style>{`
				.idle { background: #2a9d8f; transition: background .2s; }
				.out  { background: #e76f51; animation: slide .4s forwards; }
				@keyframes slide { to { transform: translateX(120px); } }
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

### Drive a frame loop

[`useAnimationFrame`](/use/animate/useAnimationFrame) returns
`{ start, stop }`, never starts on its own, and auto-stops on scope
dispose. `fn` can call `stop()` to break the loop on the same tick.

```jsx
import { render, signal } from 'pota'
import { useAnimationFrame } from 'pota/use/animate'

function App() {
	const frames = signal(0)

	const loop = useAnimationFrame(() => {
		frames.update(n => n + 1)
		if (frames.read() >= 100) loop.stop()
	})

	return (
		<>
			<button on:click={() => loop.start()}>start</button>
			<button on:click={() => loop.stop()}>stop</button>
			<p>frames: {frames.read}</p>
		</>
	)
}

render(App)
```
