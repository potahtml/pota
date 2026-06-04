---
title: shortcut
subpath: pota/use/keyboard
topic: Input
desc: Element-scoped keyboard chord ref factory.
---

# shortcut

`shortcut(combo, fn)` is a `use:ref` factory for an element-scoped
keyboard chord — it only fires when the element (or one of its
descendants) has focus. Use it for editor commands inside a
`contenteditable`, or form-local submit shortcuts. The handler
receives the `KeyboardEvent` and the element; `preventDefault` is
applied when the chord matches. See
[`pota/use/keyboard`](/use/keyboard) for chord syntax; for a
document-wide chord use
[`globalShortcut`](/use/keyboard/globalShortcut).

## Arguments

| Argument  | Type                                        | Description                                                        |
| --------- | ------------------------------------------- | ------------------------------------------------------------------ |
| `combo`   | `string`                                    | `+`-separated modifiers (`ctrl`/`meta`/`alt`/`shift`/`mod`) + key. |
| `handler` | `(e: KeyboardEvent, node: Element) => void` | Called when the chord is pressed while the element has focus.      |

**Returns:** a `use:ref` factory — `(node: Element) => void`.

## Examples

### Element-scoped shortcut

A textarea with a local formatting shortcut and submit-on-Ctrl+Enter —
both only fire while the textarea has focus.

```jsx
import { render, signal } from 'pota'
import { shortcut, submitOnCtrlEnter } from 'pota/use/keyboard'

function App() {
	const draft = signal('')
	const last = signal('')

	return (
		<form on:submit={e => e.preventDefault()}>
			<textarea
				rows="4"
				value={draft.read}
				on:input={e => draft.write(e.currentTarget.value)}
				use:ref={[
					shortcut('mod+b', () => draft.update(d => d + '**bold**')),
					submitOnCtrlEnter(() => last.write(draft.read())),
				]}
			/>
			<p>
				last submitted: <mark>{last.read}</mark>
			</p>
			<p>
				try <kbd>Ctrl/Cmd</kbd>+<kbd>B</kbd>, then <kbd>Ctrl/Cmd</kbd>
				+<kbd>Enter</kbd>
			</p>
		</form>
	)
}

render(App)
```
