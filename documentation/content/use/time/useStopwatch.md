---
title: useStopwatch
subpath: pota/use/time
topic: Utilities
desc: A reactive start / stop / reset stopwatch.
---

# useStopwatch

`useStopwatch(opts?)` returns
`{ elapsed, running, start, stop, reset }`. `elapsed()` is a reactive
reader in milliseconds; the underlying tick is `opts.interval`
(default `1000`). For finer resolution lower the interval — or drive
your own loop from
[`useAnimationFrame`](/use/animate/useAnimationFrame) reading
[`now()`](/use/time/now) directly. Pass `{ autoStart: true }` to start
on construction. Part of [`pota/use/time`](/use/time).

## Arguments

`opts` is an optional object:

| Option      | Type      | Description                                                      |
| ----------- | --------- | ---------------------------------------------------------------- |
| `autoStart` | `boolean` | Start counting on construction. Defaults to `false`.             |
| `interval`  | `number`  | Tick period in milliseconds for `elapsed()`. Defaults to `1000`. |

**Returns:** `{ elapsed, running, start, stop, reset }`. `elapsed()`
and `running()` are reactive readers (milliseconds, boolean);
`start()`, `stop()`, and `reset()` return the same control object so
calls chain.

## Examples

### Start, stop, reset

Drives a stopwatch with manual controls, ticking every 100ms.

```jsx
import { render } from 'pota'
import { useStopwatch } from 'pota/use/time'

function App() {
	const sw = useStopwatch({ interval: 100 })

	return (
		<div>
			<h2>{() => (sw.elapsed() / 1000).toFixed(1)}s</h2>
			<button on:click={sw.start}>start</button>
			<button on:click={sw.stop}>stop</button>
			<button on:click={sw.reset}>reset</button>
			<p>{() => (sw.running() ? 'running' : 'paused')}</p>
		</div>
	)
}

render(App)
```
