---
title: datetime
subpath: pota/use/time
topic: Utilities
desc: Format a timestamp as YYYY-MM-DD HH:MM.
---

# datetime

`datetime(timestamp = now())` formats a timestamp as
`YYYY-MM-DD HH:MM` — [`date`](/use/time/date) plus `time`. Part of
[`pota/use/time`](/use/time); defaults to [`now()`](/use/time/now)
when called with no argument.

## Arguments

| Argument    | Type     | Description                                    |
| ----------- | -------- | ---------------------------------------------- |
| `timestamp` | `number` | Milliseconds since the epoch. Default `now()`. |

**Returns:** `string` — the date and time as `YYYY-MM-DD HH:MM`.

## Examples

### Format a date and time

Renders the current date and time, then a fixed timestamp.

```jsx
import { render } from 'pota'
import { datetime } from 'pota/use/time'

function App() {
	return (
		<ul>
			<li>{datetime()}</li>
			<li>{datetime(1474075200000)}</li>
		</ul>
	)
}

render(App)
```
