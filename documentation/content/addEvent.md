---
title: addEvent
subpath: pota
topic: Events
desc:
  Imperative addEventListener tied to the reactive scope — returns an
  off() and auto-detaches on disposal.
---

# addEvent

Imperative event-listener helper that ties a listener to the reactive
scope. Reach for it outside JSX (in effects, lifecycles, or standalone
code) when you need `DOM.addEventListener`-like control. The
declarative form is the [`on:__`](/guide/jsx/on:__) attribute.

`addEvent(node, type, handler)` adds the listener and returns an
`off()` function that removes it. The same removal is _also_
registered as a [`cleanup`](/cleanup) on the current reactive scope,
so the listener is torn down automatically when the scope is disposed
— you don't have to call `off()` manually in most cases. Its
counterpart is [`removeEvent`](/removeEvent).

## Arguments

| name      | type                                                  | description                                                               |
| --------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `node`    | `Document \| Window \| Element`                       | the node on which to add the event listener                               |
| `type`    | string                                                | event to listen for, e.g. `click`. Case-sensitive, as with regular events |
| `handler` | fn \| `{ handleEvent, once?, passive?, capture?, … }` | handler to run once the event is triggered                                |

**Returns:** an `off()` function that removes the listener.

## Auto-detach on disposal

Adding a global listener (`window` / `document`) registers a cleanup
that removes it when the surrounding owner disposes — saving you the
manual `cleanup(() => removeEventListener(...))` dance.

## Examples

### Listen for keystrokes on window

Adds a `keydown` listener on `window` and writes each key into a
signal. The listener is removed automatically when the component is
disposed.

```jsx
import { addEvent, render, signal } from 'pota'

function App() {
	const key = signal('press anything')

	addEvent(window, 'keydown', e => {
		key.write(`pressed: ${e.key}`)
	})

	return <p>{key.read}</p>
}

render(App)
```
