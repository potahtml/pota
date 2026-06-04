---
title: timing
subpath: pota/use/time
topic: Utilities
desc: Measure how long a function takes, in milliseconds.
---

# timing

`timing(fn)` runs `fn` and returns how long it took, in milliseconds
(via `performance.now()`). For console-timed measurement that also
returns `fn`'s value, use [`measure`](/use/time/measure). Part of
[`pota/use/time`](/use/time).

## Arguments

| Argument | Type         | Description       |
| -------- | ------------ | ----------------- |
| `fn`     | `() => void` | The work to time. |

**Returns:** a `number` — the elapsed milliseconds.

## Examples

### Measure a duration

Times a synchronous workload and reports the elapsed milliseconds.

```jsx
import { render } from 'pota'
import { timing } from 'pota/use/time'

function heavyWork() {
	let sum = 0
	for (let i = 0; i < 1e6; i++) sum += i
	return sum
}

function App() {
	const ms = timing(heavyWork)
	return <p>took {ms.toFixed(2)}ms</p>
}

render(App)
```
