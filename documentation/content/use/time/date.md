---
title: date
subpath: pota/use/time
topic: Utilities
desc: Format a timestamp as YYYY-MM-DD.
---

# date

`date(timestamp = now())` formats a timestamp as `YYYY-MM-DD`. Part of
[`pota/use/time`](/use/time); defaults to [`now()`](/use/time/now)
when called with no argument.

## Arguments

| Argument    | Type     | Description                                    |
| ----------- | -------- | ---------------------------------------------- |
| `timestamp` | `number` | Milliseconds since the epoch. Default `now()`. |

**Returns:** `string` — the date as `YYYY-MM-DD`.

## Examples

### Format a date

Renders today's date, then a fixed timestamp.

```jsx
import { render } from 'pota'
import { date } from 'pota/use/time'

function App() {
	return (
		<ul>
			<li>{date()}</li>
			<li>{date(1474075200000)}</li>
		</ul>
	)
}

render(App)
```
