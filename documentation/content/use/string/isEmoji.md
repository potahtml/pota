---
title: isEmoji
subpath: pota/use/string
topic: Utilities
desc: True when the string contains at least one emoji.
---

# isEmoji

`isEmoji(value)` returns `true` when `value` contains at least one
emoji, matched against a full Unicode emoji regex (sequences,
modifiers, flags, and ZWJ combinations included). It does not require
the whole string to be emoji — any emoji anywhere makes it `true`.

Part of [`pota/use/string`](/use/string).

## Arguments

| Argument | Type     | Description         |
| -------- | -------- | ------------------- |
| `value`  | `string` | The string to scan. |

**Returns:** `boolean` — `true` if `value` contains any emoji.

## Examples

### Detect emoji in input

Flags whether the current input value contains an emoji.

```jsx
import { render, signal } from 'pota'
import { isEmoji } from 'pota/use/string'

function App() {
	const text = signal('hello 🌮')
	const found = () => isEmoji(text.read())

	return (
		<>
			<input
				prop:value={text.read}
				on:input={e => text.write(e.currentTarget.value)}
			/>
			<p>{() => (found() ? 'contains emoji' : 'no emoji')}</p>
		</>
	)
}

render(App)
```
