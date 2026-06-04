---
title: useKeyHeld
subpath: pota/use/keyboard
topic: Input
desc: Reactive boolean — whether a key is currently held.
---

# useKeyHeld

`useKeyHeld(key)` returns a reactive reader that flips between `true`
and `false` as the key goes down and up — useful for game-style input,
canvas controls, or any UI driven by held state rather than key-press
events. Multiple subscribers share a single window-level tracker
(keydown/keyup/blur listeners on `window`) that auto-detaches once the
last subscriber unmounts. `key` follows `KeyboardEvent.key`
lowercased: `'a'`, `' '` for space, `'arrowup'`, `'shift'`, etc. For a
non-reactive live set use [`keysHeld`](/use/keyboard/keysHeld). Part
of [`pota/use/keyboard`](/use/keyboard).

Keydown is **ignored while focus is inside an editable element**
(`<input>`, `<textarea>`, `<select>`, or `contenteditable`) so typing
doesn't trip held state — the reader stays `false` for keys pressed
while editing. Keyup is always honored so keys can't get stuck, and OS
key-repeat events don't flip the signal: only the actual press/release
transitions do.

## Arguments

| Argument | Type     | Description                                           |
| -------- | -------- | ----------------------------------------------------- |
| `key`    | `string` | Key to track, matched lowercased against `event.key`. |

**Returns:** `() => boolean` — a reader that is `true` while the key
is held.

## Examples

### React to a held key

Toggle a class while the Shift key is down. Because the reader is
reactive, the [effect](/effect) re-runs on each press/release.

```jsx
import { render, effect, signal } from 'pota'
import { useKeyHeld } from 'pota/use/keyboard'

function App() {
	const shift = useKeyHeld('shift')

	return (
		<p class={() => (shift() ? 'shifted' : '')}>
			hold <kbd>Shift</kbd> to highlight this text
		</p>
	)
}

render(App)
```

### Arrow-key driven position

Derive UI directly from held-key readers — no effects needed. Holding
an arrow key keeps the offset reactive while it is down.

```jsx
import { render, memo } from 'pota'
import { useKeyHeld } from 'pota/use/keyboard'

function App() {
	const up = useKeyHeld('arrowup')
	const down = useKeyHeld('arrowdown')

	const y = memo(() => (up() ? -1 : 0) + (down() ? 1 : 0))

	return (
		<div>
			<p>
				direction:{' '}
				{() => (y() === 0 ? 'idle' : y() < 0 ? 'up' : 'down')}
			</p>
			<p>hold the arrow keys (not while typing in a field)</p>
		</div>
	)
}

render(App)
```
