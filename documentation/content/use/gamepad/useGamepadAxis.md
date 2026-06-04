---
title: useGamepadAxis
subpath: pota/use/gamepad
topic: Input
desc: Reactive number -1..1 for a stick axis (raw).
---

# useGamepadAxis

Reactive number in `[-1, 1]` for a single stick axis. The value is raw
— apply your own deadzone where you need one
(`Math.abs(v) < threshold ? 0 : v`). For analog triggers use
[`useGamepadTrigger`](/use/gamepad/useGamepadTrigger). Part of
[`pota/use/gamepad`](/use/gamepad).

## Arguments

| Argument       | Type     | Description                               |
| -------------- | -------- | ----------------------------------------- |
| `axisIndex`    | `number` | Axis index (e.g. `0` left-X, `1` left-Y). |
| `gamepadIndex` | `number` | Gamepad index. Default is `0`.            |

**Returns:** `() => number` — a reader function you can pass straight
into JSX as a reactive child or value.

## Examples

### Move a dot with the left stick

Derives an X/Y position from the two left-stick axes and feeds it into
an inline style. A small deadzone keeps the dot still when the stick
is centered. The reader functions go straight into the reactive `left`
/ `top` style wrappers.

```jsx
import { render } from 'pota'
import { useGamepadAxis } from 'pota/use/gamepad'

const deadzone = v => (Math.abs(v) < 0.15 ? 0 : v)

function App() {
	const x = useGamepadAxis(0)
	const y = useGamepadAxis(1)

	return (
		<div
			style={{
				position: 'absolute',
				width: '20px',
				height: '20px',
				'border-radius': '50%',
				background: 'crimson',
				left: () => 100 + deadzone(x()) * 100 + 'px',
				top: () => 100 + deadzone(y()) * 100 + 'px',
			}}
		/>
	)
}

render(App)
```
