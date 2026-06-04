---
title: time
subpath: pota/use/time
topic: Utilities
desc:
  Clock formatters, auto-disposing timers, relative-time readers, and
  a stopwatch.
---

# `pota/use/time`

Clock formatters, `useTimeout` for auto-disposing timers, `useElapsed`
for relative-time readers that re-render on unit boundaries, and
`useStopwatch` for start/stop/reset counters.

## Exports

- [`now()`](/use/time/now) — `Date.now()`
- [`date(ts?)`](/use/time/date) — `YYYY-MM-DD`
- [`datetime(ts?)`](/use/time/datetime) — `YYYY-MM-DD HH:MM`
- `time(ts?)` — `HH:MM` (documented below)
- [`timeWithSeconds(ts?)`](/use/time/timeWithSeconds) — `HH:MM:SS`
- [`day(ts?, lang?)`](/use/time/day) — locale-aware weekday + date
- [`measure(name, cb, report?)`](/use/time/measure) — run `cb`,
  reporting its time
- [`timing(fn)`](/use/time/timing) — milliseconds `fn` took
- [`useTimeout(cb, delay, ...args)`](/use/time/useTimeout) —
  auto-disposing, reactive-delay timer
- [`useElapsed(timestamp)`](/use/time/useElapsed) — relative time
  without per-second renders
- [`useStopwatch(opts?)`](/use/time/useStopwatch) — start / stop /
  reset counter

## time

`time(timestamp = now())` formats a timestamp as `HH:MM`. The other
clock formatters are [`date`](/use/time/date),
[`datetime`](/use/time/datetime),
[`timeWithSeconds`](/use/time/timeWithSeconds), and
[`day`](/use/time/day); all default to [`now()`](/use/time/now).

## Examples

### Format the current time

Renders the current `HH:MM` clock. Pass a timestamp to format any
other moment.

```jsx
import { render } from 'pota'
import { time } from 'pota/use/time'

function App() {
	return <p>It is {time()}</p> // e.g. '14:25'
}

render(App)
```
