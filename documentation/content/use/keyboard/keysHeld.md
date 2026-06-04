---
title: keysHeld
subpath: pota/use/keyboard
topic: Input
desc: Live, non-reactive Set of currently held keys.
---

# keysHeld

`keysHeld()` returns the underlying live, non-reactive `Set` of
lowercased held keys. Reads don't subscribe — it's meant for
[`useAnimationFrame`](/use/animate) loops where reactive tracking
would be wasted overhead: WASD movement, hold-to-charge meters,
modifier inspection during a drag. The set is mutated in place by the
shared tracker; treat it as read-only. For a reactive per-key boolean
use [`useKeyHeld`](/use/keyboard/useKeyHeld). Part of
[`pota/use/keyboard`](/use/keyboard).

The tracker attaches its keydown/keyup/blur listeners on `window` and
**ignores keydown while focus is inside an editable element**
(`<input>`, `<textarea>`, `<select>`, or `contenteditable`), so typing
never populates the set. Keyup is always honored and OS key-repeat
events are skipped.

## Arguments

`keysHeld()` takes no arguments.

**Returns:** `Set<string>` — the live set of currently-held keys,
lowercased per `KeyboardEvent.key`.

## Examples

### Poll held keys per frame

Drive movement from the live set inside an animation-frame loop, where
re-running on every key change would be pointless churn.

```jsx
import { render, signal } from 'pota'
import { keysHeld } from 'pota/use/keyboard'
import { useAnimationFrame } from 'pota/use/animate'

function App() {
	const x = signal(0)
	const y = signal(0)
	const held = keysHeld()

	useAnimationFrame(() => {
		if (held.has('w')) y.update(v => v - 1)
		if (held.has('s')) y.update(v => v + 1)
		if (held.has('a')) x.update(v => v - 1)
		if (held.has('d')) x.update(v => v + 1)
	}).start()

	return (
		<p>
			hold <kbd>W</kbd>/<kbd>A</kbd>/<kbd>S</kbd>/<kbd>D</kbd> —
			position {() => `(${x.read()}, ${y.read()})`}
		</p>
	)
}

render(App)
```
