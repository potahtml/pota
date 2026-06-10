---
title: listener
subpath: pota
topic: Reactive core
desc:
  Returns the currently-running reactive listener — the tracking scope
  an inner read would subscribe to.
---

# listener

Returns the currently-running reactive listener (the tracking scope an
inner computation is inside), or `undefined` if there is none. A
low-level introspection helper — handy when authoring a primitive that
wants to behave differently inside vs. outside a reactive scope. Most
app code never needs it; reach for [effect](/effect) / [memo](/memo)
instead. Sibling to [owner](/owner), which tracks _lifetime_ rather
than tracking.

## Arguments

`listener()` takes no arguments.

**Returns:** the active tracking scope (effect / memo / derived) as a
`Computation`, or `undefined` when reads would not subscribe.

## Examples

### Detect a tracking scope

Branch behavior based on whether reads will subscribe — useful when
authoring a getter that should return a memo when tracked but a plain
value otherwise.

```jsx
import { effect, listener, render, signal } from 'pota'

const value = signal(1)
const log = signal('')

function read() {
	if (listener()) {
		log.write('tracked read')
	} else {
		log.write('untracked read')
	}
	return value.read()
}

function App() {
	return (
		<div>
			<button on:click={() => read()}>untracked read</button>
			<button on:click={() => effect(() => read())}>
				tracked read
			</button>
			<p>{log.read}</p>
		</div>
	)
}

render(App)
```
