---
title: now
subpath: pota/use/time
topic: Utilities
desc: Native Date.now() — current time in milliseconds.
---

# now

`now()` is native `Date.now()` — the current time in milliseconds
since the epoch. It is the default `timestamp` for every formatter in
[`pota/use/time`](/use/time): [`date`](/use/time/date),
[`datetime`](/use/time/datetime), `time`,
[`timeWithSeconds`](/use/time/timeWithSeconds), and
[`day`](/use/time/day).

## Arguments

Takes no arguments.

**Returns:** `number` — milliseconds since the epoch.

## Examples

### Read the current time

Renders the current epoch millisecond count.

```jsx
import { render } from 'pota'
import { now } from 'pota/use/time'

function App() {
	return <p>{now()} ms since the epoch</p>
}

render(App)
```
