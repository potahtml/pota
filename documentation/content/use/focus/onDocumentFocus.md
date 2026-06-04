---
title: onDocumentFocus
subpath: pota/use/focus
topic: Interaction
desc: Callback fired when the document gains or loses focus.
---

# onDocumentFocus

`onDocumentFocus(fn)` registers a callback that runs with the current
document focus state — `true` when the document has focus, `false`
when it loses it. It fires immediately with the initial state and then
on every window `focus` / `blur`. For a reactive accessor instead of a
callback use [`useDocumentFocus`](/use/focus/useDocumentFocus). Part
of [`pota/use/focus`](/use/focus).

The subscription is scoped to the surrounding reactive owner, so call
it inside a component or another reactive scope; it cleans up
automatically when that scope is disposed.

## Arguments

| Argument | Type                      | Description                                                  |
| -------- | ------------------------- | ------------------------------------------------------------ |
| `fn`     | `(focused: boolean) => …` | Called with the current focus state now and on every change. |

## Examples

### Subscribe to focus changes

Logs whenever the browser tab/window gains or loses focus, starting
with its current state.

```jsx
import { render } from 'pota'
import { onDocumentFocus } from 'pota/use/focus'

function App() {
	onDocumentFocus(focused =>
		console.log(focused ? 'gained focus' : 'lost focus'),
	)

	return <p>switch tabs to see focus events in the console</p>
}

render(App)
```
