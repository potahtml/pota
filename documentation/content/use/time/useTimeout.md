---
title: useTimeout
subpath: pota/use/time
topic: Utilities
desc: An auto-disposing setTimeout with a reactive delay.
---

# useTimeout

`useTimeout(callback, delay, ...args)` creates a `setTimeout` that
auto-disposes: it cancels automatically when the owning reactive scope
is disposed. The timeout is **not** started automatically — call
`start()` to schedule the callback and `stop()` to cancel it. `delay`
may be an accessor, in which case writing to it restarts the pending
timeout, so the underlying `setTimeout` resets every time the delay
changes — useful for "save after N ms of idle"-style flows where the
user can adjust the threshold live. Part of
[`pota/use/time`](/use/time).

## Arguments

| Argument   | Type                           | Description                                                              |
| ---------- | ------------------------------ | ------------------------------------------------------------------------ |
| `callback` | `(...args: unknown[]) => void` | Runs once the delay completes.                                           |
| `delay`    | `Accessor<number>`             | Delay in ms — a value or an accessor. A delay of `Infinity` never fires. |
| `...args`  | `unknown[]`                    | Extra arguments forwarded to `callback`.                                 |

**Returns:** `{ start, stop }`. `start()` schedules (or restarts) the
timeout and returns the control object; `stop()` cancels a pending
timeout.

## Examples

### Auto-disposing timer with datetime

Fires a callback two seconds after the button is clicked, stamping the
start time with [`datetime`](/use/time/datetime).

```jsx
import { datetime, useTimeout } from 'pota/use/time'
import { render, signal } from 'pota'

function App() {
	const status = signal('click to start')

	function start() {
		status.write(`started at ${datetime()}`)
		useTimeout(() => status.write('done!'), 2000).start()
	}

	return (
		<div>
			<button on:click={start}>start 2s timer</button>
			<p>{status.read}</p>
		</div>
	)
}

render(App)
```

### Reactive delay

Editing the delay input restarts the pending timeout with the new
value, so the timer always reflects the latest threshold.

```jsx
import { render, signal } from 'pota'
import { useTimeout } from 'pota/use/time'

function App() {
	const delay = signal(1000)
	const status = signal('idle')

	const fire = useTimeout(
		() => status.write(`fired @ ${new Date().toLocaleTimeString()}`),
		delay.read,
	)

	return (
		<div>
			<label>
				delay (ms):{' '}
				<input
					type="number"
					prop:value={delay.read}
					on:input={e => delay.write(Number(e.currentTarget.value))}
				/>
			</label>
			<button on:click={() => fire.start()}>start</button>
			<button on:click={() => fire.stop()}>stop</button>
			<p>{status.read}</p>
		</div>
	)
}

render(App)
```

### Manual start / stop

The timeout is never scheduled until you call `start()`; `stop()`
cancels a pending one. This example arms it on mount and lets you
cancel before it fires.

```jsx
import { render, signal } from 'pota'
import { useTimeout } from 'pota/use/time'

function App() {
	const status = signal('armed — fires in 2s')

	const timeout = useTimeout(() => status.write('fired!'), 2000)

	// the timeout needs to be started manually
	timeout.start()

	return (
		<div>
			<button on:click={() => timeout.stop()}>cancel</button>
			<p>{status.read}</p>
		</div>
	)
}

render(App)
```
