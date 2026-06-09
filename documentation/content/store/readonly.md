---
title: readonly
subpath: pota/store
topic: Store
desc:
  Deep-freeze a value and everything reachable from it, typing the
  result as DeepReadonly<T>.
---

# readonly

Deep-freezes `value` and everything reachable from it, then types the
result as `DeepReadonly<T>`. Useful for exposing config or constants
where downstream code shouldn't even attempt to write — silent
strict-mode failures become loud `TypeError` throws.

## Arguments

| name    | type | description                           |
| ------- | ---- | ------------------------------------- |
| `value` | `T`  | value to recursively freeze, in place |

**Returns:** the same `value`, now frozen and typed `DeepReadonly<T>`.

## Examples

### Frozen config

Reads pass through normally; any write throws in strict mode (and
TypeScript already flagged it).

```jsx
import { render, signal } from 'pota'
import { readonly } from 'pota/store'

const settings = readonly({
	api: { url: 'https://api.example.com', timeout: 5000 },
	flags: { betaUI: true },
})

function App() {
	const log = signal('')

	function testWrite() {
		try {
			settings.api.url = '...'
			log.write('write succeeded')
		} catch (e) {
			log.write(`blocked: ${e}`)
		}
	}

	return (
		<div>
			<p>api url: {settings.api.url}</p>
			<button on:click={testWrite}>try to write</button>
			<p>{log.read}</p>
		</div>
	)
}

render(App)
```
