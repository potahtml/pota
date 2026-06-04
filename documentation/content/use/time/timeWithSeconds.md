---
title: timeWithSeconds
subpath: pota/use/time
topic: Utilities
desc: Format a timestamp as HH:MM:SS.
---

# timeWithSeconds

`timeWithSeconds(timestamp = now())` formats a timestamp as
`HH:MM:SS`, zero-padded. For `HH:MM` (no seconds) use `time` from the
same module. Part of [`pota/use/time`](/use/time).

## Arguments

| Argument    | Type     | Description                                              |
| ----------- | -------- | -------------------------------------------------------- |
| `timestamp` | `number` | Unix milliseconds. Defaults to [`now()`](/use/time/now). |

**Returns:** a `string` like `'09:05:42'`.

## Examples

### Format the current time

Renders the wall-clock time including seconds.

```jsx
import { render } from 'pota'
import { timeWithSeconds } from 'pota/use/time'

function App() {
	return <p>now: {timeWithSeconds()}</p>
}

render(App)
```
