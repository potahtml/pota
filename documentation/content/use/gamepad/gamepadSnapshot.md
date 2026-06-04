---
title: gamepadSnapshot
subpath: pota/use/gamepad
topic: Input
desc: Non-reactive Gamepad snapshot for tight game loops.
---

# gamepadSnapshot

Non-reactive read of the underlying `Gamepad` object (or `null` when
nothing is connected at `index`). Use it inside a game loop that wants
every button and axis each frame without a per-element subscription.
Unlike the reactive accessors in [`pota/use/gamepad`](/use/gamepad),
this does **not** start the rAF poll on its own — it reads
`navigator.getGamepads()` directly. Pair it with
[`useAnimationFrame`](/use/animate) to drive the loop.

## Arguments

| Argument | Type     | Description                    |
| -------- | -------- | ------------------------------ |
| `index`  | `number` | Gamepad index. Default is `0`. |

**Returns:** `Gamepad | null` — the raw snapshot, or `null` if no
gamepad is at that index.

## Examples

### Drive a position from a game loop

Polls the left-stick axes once per frame and moves a dot, with a
deadzone so it sits still when centered. Reading from the snapshot
keeps the hot loop free of reactive subscriptions; only the position
signal is reactive.

```jsx
import { render, signal } from 'pota'
import { gamepadSnapshot } from 'pota/use/gamepad'
import { useAnimationFrame } from 'pota/use/animate'

const deadzone = v => (Math.abs(v) < 0.15 ? 0 : v)

function App() {
	const pos = signal({ x: 100, y: 100 })

	useAnimationFrame(() => {
		const pad = gamepadSnapshot()
		if (!pad) return
		const [lx, ly] = pad.axes
		pos.update(p => ({
			x: p.x + deadzone(lx) * 4,
			y: p.y + deadzone(ly) * 4,
		}))
	}).start()

	return (
		<div
			style={{
				position: 'absolute',
				width: '20px',
				height: '20px',
				'border-radius': '50%',
				background: 'crimson',
				left: () => pos.read().x + 'px',
				top: () => pos.read().y + 'px',
			}}
		/>
	)
}

render(App)
```
