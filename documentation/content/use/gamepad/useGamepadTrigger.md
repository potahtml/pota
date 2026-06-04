---
title: useGamepadTrigger
subpath: pota/use/gamepad
topic: Input
desc: Reactive number 0..1 for an analog trigger.
---

# useGamepadTrigger

Reactive analog accessor in `0..1` for a button's pressure. For
triggers (typically buttons `6` and `7` on a standard mapping) it's
the live pressure; for plain digital buttons the value tracks the
boolean (`0` released, `1` pressed) — for those prefer the boolean
[`useGamepadButton`](/use/gamepad/useGamepadButton). Part of
[`pota/use/gamepad`](/use/gamepad).

## Arguments

| Argument       | Type     | Description                                      |
| -------------- | -------- | ------------------------------------------------ |
| `buttonIndex`  | `number` | Button index (e.g. `6` left trigger, `7` right). |
| `gamepadIndex` | `number` | Gamepad index. Default is `0`.                   |

**Returns:** `() => number` — a reader function you can pass straight
into JSX as a reactive child or value.

## Examples

### Trigger pressure bar

Reads the left trigger and renders its `0..1` pressure as both a
percentage label and the width of a fill bar. The reader function
drives the reactive `width` style and the live text.

```jsx
import { render } from 'pota'
import { useGamepadTrigger } from 'pota/use/gamepad'

function App() {
	const lt = useGamepadTrigger(6)

	return (
		<div style={{ width: '200px', border: '1px solid #888' }}>
			<div
				style={{
					height: '16px',
					background: 'seagreen',
					width: () => lt() * 100 + '%',
				}}
			/>
			<p>Left trigger: {() => Math.round(lt() * 100) + '%'}</p>
		</div>
	)
}

render(App)
```
