---
title: submitOnCtrlEnter
subpath: pota/use/keyboard
topic: Input
desc: Ctrl/Cmd+Enter submit convenience for textareas.
---

# submitOnCtrlEnter

`submitOnCtrlEnter(fn)` is a `use:ref` convenience that calls `fn`
when the user presses Ctrl+Enter (Cmd+Enter on Mac) on the element —
the common "send on Ctrl+Enter" affordance for textareas. It is a thin
wrapper over [`shortcut('mod+enter', fn)`](/use/keyboard/shortcut), so
`preventDefault` is applied when the chord matches. Compose it with
[`shortcut`](/use/keyboard/shortcut) for other chords. Part of
[`pota/use/keyboard`](/use/keyboard).

## Arguments

| Argument | Type                                        | Description                        |
| -------- | ------------------------------------------- | ---------------------------------- |
| `fn`     | `(e: KeyboardEvent, node: Element) => void` | Handler invoked on Ctrl/Cmd+Enter. |

**Returns:** a `use:ref` factory — `(node: Element) => void`.

## Examples

### Send on Ctrl/Cmd+Enter

Submit a textarea's draft with the keyboard shortcut instead of
clicking a button.

```jsx
import { render, signal } from 'pota'
import { submitOnCtrlEnter } from 'pota/use/keyboard'

function App() {
	const draft = signal('')
	const sent = signal('')

	return (
		<div>
			<textarea
				rows="4"
				value={draft.read}
				on:input={e => draft.write(e.currentTarget.value)}
				use:ref={submitOnCtrlEnter(() => {
					sent.write(draft.read())
					draft.write('')
				})}
			/>
			<p>
				press <kbd>Ctrl/Cmd</kbd>+<kbd>Enter</kbd> to send
			</p>
			<p>
				last sent: <mark>{sent.read}</mark>
			</p>
		</div>
	)
}

render(App)
```
