---
title: globalShortcut
subpath: pota/use/keyboard
topic: Input
desc: Document-scoped keyboard chord ref factory.
---

# globalShortcut

`globalShortcut(combo, fn)` attaches a chord listener to `document`,
so it fires regardless of focus — use `mod` for the
platform-appropriate primary modifier (`ctrl` on non-Mac, `meta` on
Mac). `preventDefault` is applied when the chord matches. See
[`pota/use/keyboard`](/use/keyboard) for chord syntax; for an
element-scoped chord use [`shortcut`](/use/keyboard/shortcut).

Unlike [`shortcut`](/use/keyboard/shortcut), the handler receives only
the `KeyboardEvent` — there is no element bound to a global chord.

## Arguments

| Argument  | Type                         | Description                                                        |
| --------- | ---------------------------- | ------------------------------------------------------------------ |
| `combo`   | `string`                     | `+`-separated modifiers (`ctrl`/`meta`/`alt`/`shift`/`mod`) + key. |
| `handler` | `(e: KeyboardEvent) => void` | Called when the chord is pressed anywhere in the document.         |

**Returns:** a ref function for `use:ref` — it ignores the element
it's attached to; the listener is document-wide regardless.

## Examples

### Document-scoped shortcut

A command palette toggled by Ctrl/Cmd+K and dismissed with Escape,
working no matter where focus sits.

```jsx
import { render, signal } from 'pota'
import { Show } from 'pota/components'
import { globalShortcut } from 'pota/use/keyboard'

function App() {
	const open = signal(false)

	return (
		<div
			use:ref={[
				globalShortcut('mod+k', () => open.write(true)),
				globalShortcut('escape', () => open.write(false)),
			]}
		>
			<p>
				press <kbd>Ctrl/Cmd</kbd>+<kbd>K</kbd> to open the palette
			</p>
			<Show when={open.read}>
				<div
					style={{
						position: 'fixed',
						top: '20%',
						left: '50%',
						transform: 'translateX(-50%)',
						padding: '1rem 2rem',
						background: 'white',
						border: '1px solid #aaa',
						'box-shadow': '0 8px 24px rgba(0,0,0,0.2)',
					}}
				>
					<h3>Command palette</h3>
					<p>press Escape to close</p>
				</div>
			</Show>
		</div>
	)
}

render(App)
```
