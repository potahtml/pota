---
title: useGamepadConnected
subpath: pota/use/gamepad
topic: Input
desc: Reactive boolean — whether a gamepad is connected.
---

# useGamepadConnected

Reactive boolean — `true` while a gamepad is connected at `index`.
Connect state is derived from the shared poll, so it observes
everything `gamepadconnected` / `gamepaddisconnected` would, within
one frame. Part of [`pota/use/gamepad`](/use/gamepad).

## Arguments

| Argument | Type     | Description                             |
| -------- | -------- | --------------------------------------- |
| `index`  | `number` | Gamepad index to watch. Default is `0`. |

**Returns:** `() => boolean` — a reader function you can pass straight
into JSX as a reactive child or `<Show>` condition.

## Examples

### Show connection status

Renders a live label that flips as the gamepad is plugged in or
removed. The accessor is the reader function, so it goes straight into
the `<Show>` condition.

```jsx
import { render } from 'pota'
import { Show } from 'pota/components'
import { useGamepadConnected } from 'pota/use/gamepad'

function App() {
	const connected = useGamepadConnected(0)
	return (
		<Show
			when={connected}
			fallback={<p>No gamepad — press a button</p>}
		>
			<p>Gamepad connected</p>
		</Show>
	)
}

render(App)
```
