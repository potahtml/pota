---
title: useDocumentFocus
subpath: pota/use/focus
topic: Interaction
desc: Signal accessor — does the document currently have focus?
---

# useDocumentFocus

`useDocumentFocus()` returns a signal accessor that is `true` when the
document has focus, reflecting window `focus` / `blur` events. For a
plain callback use [`onDocumentFocus`](/use/focus/onDocumentFocus).
Part of [`pota/use/focus`](/use/focus).

The accessor is a reader function: call `hasFocus()` to read the
current value once, or pass `hasFocus` as a reactive child / prop so
the UI updates on every window `focus` / `blur`. Its initial value
reflects `!document.hidden`.

## Examples

### Reflect focus state in the UI

Render a live indicator that flips when the window gains or loses
focus. Click away from the page (or switch tabs) to see it update.

```jsx
import { render } from 'pota'
import { useDocumentFocus } from 'pota/use/focus'

function App() {
	const hasFocus = useDocumentFocus()

	return (
		<p>
			the document is {() => (hasFocus() ? 'focused' : 'not focused')}
		</p>
	)
}

render(App)
```
