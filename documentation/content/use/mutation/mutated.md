---
title: mutated
subpath: pota/use/mutation
topic: Observers
desc:
  use:ref factory — run a handler on each batch of MutationRecords.
---

# mutated

`mutated(handler, init?)` is a `use:ref` factory from
[`pota/use/mutation`](/use/mutation). Attach it to a container and
`handler` fires with each batch of `MutationRecord`s; the `init` bag
is forwarded verbatim to `MutationObserver` (default
`{ childList: true, subtree: true }`).

## Arguments

| Argument  | Type                                  | Description                                                |
| --------- | ------------------------------------- | ---------------------------------------------------------- |
| `handler` | `(records: MutationRecord[]) => void` | Called with each batch of records.                         |
| `init`    | `MutationObserverInit`                | Optional observer config; defaults to childList + subtree. |

**Returns:** a ref function `(node) => void` for use with `use:ref`.

## Examples

### React to descendant changes

Log every `childList` mutation as items are added to a container. The
default `init` already watches `childList` and `subtree`, so no `init`
bag is needed.

```jsx
import { render, signal } from 'pota'
import { mutated } from 'pota/use/mutation'

function App() {
	const count = signal(0)
	const log = signal([])

	return (
		<div>
			<div
				id="bucket"
				use:ref={mutated(records => {
					log.update(prev => [
						...prev,
						...records.map(
							r => `${r.type} (${r.addedNodes.length} added)`,
						),
					])
				})}
				style={{ padding: '1rem', border: '1px solid #aaa' }}
			>
				{() =>
					[...Array(count.read())].map((_, i) => <p>item {i + 1}</p>)
				}
			</div>
			<button on:click={() => count.update(n => n + 1)}>add</button>
			<ul>{() => log.read().map(line => <li>{line}</li>)}</ul>
		</div>
	)
}

render(App)
```

### Attribute-only observation

Pass a custom `init` to watch only attribute changes, then collect the
name of each attribute that mutated when the `class` toggles.

```jsx
import { render, signal } from 'pota'
import { mutated } from 'pota/use/mutation'

function App() {
	const flag = signal(false)
	const seen = signal([])

	return (
		<div>
			<div
				class={() => (flag.read() ? 'on' : 'off')}
				use:ref={mutated(
					records => {
						seen.update(prev => [
							...prev,
							...records.map(r => r.attributeName),
						])
					},
					{ attributes: true, attributeOldValue: true },
				)}
				style={{ padding: '1rem', border: '1px solid #aaa' }}
			>
				watched
			</div>
			<button on:click={() => flag.update(v => !v)}>toggle</button>
			<pre>{() => seen.read().join('\n')}</pre>
		</div>
	)
}

render(App)
```
