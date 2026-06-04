---
title: useAnimationFrame
subpath: pota/use/animate
topic: Animation
desc:
  Owned requestAnimationFrame loop with start/stop, auto-stopped on
  dispose.
---

# useAnimationFrame

`useAnimationFrame(fn)` drives `fn(timestamp)` once per animation
frame. It returns `{ start, stop }`, does _not_ start automatically,
and auto-stops on scope dispose. `fn` may call `stop()` (or `start()`)
to break out of or restart the loop synchronously — the next frame is
scheduled before `fn` runs, so a cancel inside takes effect
immediately. Part of [`pota/use/animate`](/use/animate).

## Arguments

| Argument | Type                                       | Description                                  |
| -------- | ------------------------------------------ | -------------------------------------------- |
| `fn`     | `(timestamp: DOMHighResTimeStamp) => void` | Called once per frame with the frame's clock |

**Returns:** `{ start, stop }` — both methods return the controller so
calls can be chained. `start()` restarts the loop; `stop()` cancels
the pending frame.

## Examples

### A frame counter

Counts elapsed frames into a signal and stops the loop after one
hundred. Calling `stop()` from inside `fn` cancels the
already-scheduled next frame, so the loop halts on the same tick.

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
