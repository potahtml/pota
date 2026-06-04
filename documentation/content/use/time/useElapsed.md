---
title: useElapsed
subpath: pota/use/time
topic: Utilities
desc:
  Reactive seconds-elapsed reader that re-renders only on unit
  boundaries.
---

# useElapsed

`useElapsed(timestamp)` returns a reactive reader of seconds elapsed
since a Unix timestamp. The trick: it re-evaluates only on the next
unit boundary — once per second under a minute, once per minute under
an hour, once per hour under a day, and so on — so a row that says _"5
days ago"_ doesn't re-render every second. The argument may be a value
or an accessor; when it's an accessor, reads reflect a changed
timestamp immediately, not just at the next tick. `0` / falsy values
return `0` and stop the ticker. Auto-cleans on scope dispose via the
underlying [useTimeout](/use/time/useTimeout). Part of
[`pota/use/time`](/use/time).

## Arguments

| Argument    | Type                                            | Description                                                                          |
| ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `timestamp` | `number \| (() => number \| undefined \| null)` | Unix **seconds** — a value or an accessor. Falsy values return `0` and stop ticking. |

**Returns:** a reader `() => number` of seconds elapsed since
`timestamp`.

## Examples

### Relative time without per-second renders

A relative-time label that re-renders on unit boundaries instead of
every second, even for timestamps days in the past.

```jsx
import { render, signal } from 'pota'
import { now, useElapsed } from 'pota/use/time'

function format(seconds) {
	if (seconds < 60) return `${Math.floor(seconds)}s`
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
	return `${Math.floor(seconds / 86400)}d`
}

function App() {
	const since = signal(now() / 1000)
	const elapsed = useElapsed(since.read)

	return (
		<div>
			<button on:click={() => since.write(now() / 1000)}>
				reset to now
			</button>
			<p>elapsed: {() => format(elapsed())}</p>
			<p>
				<small>
					re-runs once per second under a minute, once per minute
					under an hour, etc. — no per-second renders for old data
				</small>
			</p>
		</div>
	)
}

render(App)
```
