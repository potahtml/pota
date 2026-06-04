---
title: useGamepadButton
subpath: pota/use/gamepad
topic: Input
desc: Reactive boolean — whether a gamepad button is pressed.
---

# useGamepadButton

Reactive boolean that is `true` while the given digital button is
pressed. For analog controls (triggers) read
[`useGamepadTrigger`](/use/gamepad/useGamepadTrigger) instead, which
gives the `0..1` pressure. Part of [`pota/use/gamepad`](/use/gamepad).

## Arguments

| Argument       | Type     | Description                                   |
| -------------- | -------- | --------------------------------------------- |
| `buttonIndex`  | `number` | Button index (e.g. `0` is A on standard map). |
| `gamepadIndex` | `number` | Gamepad index. Default is `0`.                |

**Returns:** `() => boolean` — a reader function you can pass straight
into JSX as a reactive child or condition.

## Examples

### Highlight a button while held

The reader function drives the `class` reactively, so the box lights
up while button `0` (A on the standard mapping) is held.

```jsx
import { render } from 'pota'
import { useGamepadButton } from 'pota/use/gamepad'

function App() {
	const pressed = useGamepadButton(0)
	return (
		<div class={() => (pressed() ? 'held' : 'idle')}>
			A button: {() => (pressed() ? 'down' : 'up')}
		</div>
	)
}

render(App)
```
