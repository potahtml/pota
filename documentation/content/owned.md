---
title: owned
subpath: pota
topic: Reactive core
desc:
  Binds a callback to the current owner so it runs under that scope
  later — or is skipped if the owner disposed.
---

# owned

Captures the current owner and returns a function bound to it. Calling
that function re-runs `fn` under the captured owner, as long as the
owner hasn't been disposed. If the owner is disposed before the
function is called, the call is skipped and `onCancel` runs instead
(once, at disposal). Useful for scheduling deferred work (timers,
promises, websocket callbacks) that must not outlive the component
that scheduled it. Pair with [cleanup](/cleanup) when you also need to
tear down the resource itself.

Built on [owner](/owner) and `runWithOwner`.

## Arguments

| name        | type                | description                                                              |
| ----------- | ------------------- | ------------------------------------------------------------------------ |
| `fn`        | `(...args) => void` | callback to run under the captured owner                                 |
| `onCancel?` | `() => void`        | called instead of `fn` when the captured owner has already been disposed |

**Returns:** a wrapper function. Arguments passed to it are forwarded
to `fn`. If the owner is still alive it returns `fn`'s result; if the
owner was disposed it returns `false` and does nothing.

## Examples

### Owner-bound async callback

A deferred write that is skipped if the component unmounts first. When
the surrounding component unmounts (or a parent re-renders past it),
the captured owner disposes and the wrapped callback becomes a no-op —
the timer's write to `status` is dropped instead of tearing into a
disposed scope.

```jsx
import { owned, render, signal } from 'pota'

function App() {
	const status = signal('idle')

	function startSlowWork() {
		status.write('working…')
		const finish = owned(() => status.write('done'))
		setTimeout(finish, 2000)
	}

	return (
		<div>
			<p>status: {status.read}</p>
			<button on:click={startSlowWork}>start</button>
		</div>
	)
}

render(App)
```

### Cancel work when the owner disposes

`onCancel` lets you run teardown when the scheduled callback never
fires because its owner was disposed first.

```jsx
import { owned, render, signal } from 'pota'

function App() {
	const log = signal('idle')

	function schedule() {
		const run = owned(
			() => log.write('ran'),
			() => log.write('cancelled'),
		)
		setTimeout(run, 1000)
	}

	return (
		<div>
			<p>{log.read}</p>
			<button on:click={schedule}>schedule</button>
		</div>
	)
}

render(App)
```
