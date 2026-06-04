---
title: catchError
subpath: pota
topic: Reactive core
desc:
  Runs a function inside an error boundary, routing any thrown error —
  sync or reactive — to a handler instead of the console.
---

# catchError

Runs `fn` inside an error boundary. If it throws — synchronously, from
an effect, or from a rejected [derived](/derived)/[action](/action)
chain — `handler(err)` is called and the error does not bubble or
reach the console. Returns the value of `fn`, or `undefined` if it
threw.

It is the building block behind [`<Errored/>`](/components/Errored);
reach for it when you need a programmatic boundary outside JSX.

## Arguments

| name      | type            | description                         |
| --------- | --------------- | ----------------------------------- |
| `fn`      | `() => T`       | function to run inside the boundary |
| `handler` | `(err) => void` | handler called for any thrown error |

**Returns:** the return value of `fn`, or `undefined` if it threw.

## Examples

### Programmatic boundary

Catches a throw from inside the boundary and routes it to the handler,
which writes the message into a signal instead of letting it surface
on the console.

```jsx
import { catchError, render, root, signal } from 'pota'

function App() {
	const message = signal('not yet')

	root(() => {
		catchError(
			() => {
				throw new Error('boom')
			},
			err => message.write(`caught: ${err.message}`),
		)
	})

	return <p>{message.read}</p>
}

render(App)
```
