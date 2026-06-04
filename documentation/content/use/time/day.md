---
title: day
subpath: pota/use/time
topic: Utilities
desc:
  Locale-aware weekday and date, e.g. Saturday, September 17, 2016.
---

# day

`day(timestamp = now(), lang = 'en')` formats a timestamp using
locale-aware weekday and date components — e.g.
`Saturday, September 17, 2016`. Built on
`Date.prototype.toLocaleDateString` with `weekday`, `year`, `month`,
and `day` all set to `long`/`numeric`. Part of
[`pota/use/time`](/use/time); defaults to [`now()`](/use/time/now)
when called with no argument.

## Arguments

| Argument    | Type                   | Description                                            |
| ----------- | ---------------------- | ------------------------------------------------------ |
| `timestamp` | `number`               | Milliseconds since the epoch. Default `now()`.         |
| `lang`      | `Intl.LocalesArgument` | Locale passed to `toLocaleDateString`. Default `'en'`. |

**Returns:** `string` — the localized weekday and date.

## Examples

### Localized weekday and date

Renders the same instant formatted in two locales.

```jsx
import { render } from 'pota'
import { day } from 'pota/use/time'

function App() {
	return (
		<ul>
			<li>{day(1474075200000)}</li>
			<li>{day(1474075200000, 'es')}</li>
		</ul>
	)
}

render(App)
```
