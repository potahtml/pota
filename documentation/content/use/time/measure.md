---
title: measure
subpath: pota/use/time
topic: Utilities
desc: Run a function while reporting its execution time via console.
---

# measure

`measure(name, cb, timeReport?)` runs `cb` while reporting its
execution time via `console.time` / `console.timeEnd` under `name`,
and returns whatever `cb` returns. Pass `timeReport(duration)` to also
receive the duration in milliseconds. For a bare duration without the
console output, use [`timing`](/use/time/timing). Part of
[`pota/use/time`](/use/time).

## Arguments

| Argument     | Type                         | Description                                         |
| ------------ | ---------------------------- | --------------------------------------------------- |
| `name`       | `string`                     | Label passed to `console.time` / `console.timeEnd`. |
| `cb`         | `() => T`                    | Function to run and time.                           |
| `timeReport` | `(duration: number) => void` | Optional callback receiving the duration in ms.     |

**Returns:** `T` — whatever `cb` returns.

## Examples

### Time a block

Runs the callback, logs `build list: <ms>` to the console, and returns
the callback's value.

```jsx
import { measure } from 'pota/use/time'

const buildList = () => Array.from({ length: 1000 }, (_, i) => i)

const result = measure('build list', buildList)
```

### Capture the duration

Pass a third callback to receive the elapsed milliseconds alongside
the console output.

```jsx
import { measure } from 'pota/use/time'

let ms = 0
const result = measure(
	'build list',
	() => Array.from({ length: 1000 }, (_, i) => i),
	duration => (ms = duration),
)
```
