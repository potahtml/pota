---
title: onMutations
subpath: pota/use/mutation
topic: Observers
desc: Callback fired with each batch of MutationRecords.
---

# onMutations

`onMutations(node, fn, init?)` calls `fn` with each batch of
`MutationRecord`s observed on `node` — the callback half of the
[`pota/use/mutation`](/use/mutation) emitter pair. For a reactive
accessor use [`useMutations`](/use/mutation/useMutations); to attach
an observer declaratively use [`mutated`](/use/mutation/mutated). The
default `init` is `{ childList: true, subtree: true }`.

`fn` is only ever called with a real `MutationRecord[]` batch — the
pre-observer placeholder is filtered out.

## Arguments

| Argument | Type                                  | Description                                                |
| -------- | ------------------------------------- | ---------------------------------------------------------- |
| `node`   | `Node`                                | Element to observe.                                        |
| `fn`     | `(records: MutationRecord[]) => void` | Called with each batch of records.                         |
| `init`   | `MutationObserverInit`                | Optional observer config; defaults to childList + subtree. |

## Examples

### Subscribe to mutations

Register a callback that logs each `MutationRecord[]` batch observed
on a node you already hold a reference to.

```jsx
import { render, signal } from 'pota'
import { onMutations } from 'pota/use/mutation'

function App() {
	const log = signal('mutations will appear here')

	onMutations(document.body, records => {
		log.write(`mutations: ${records.length}`)
	})

	return <p>{log.read}</p>
}

render(App)
```
