---
title: useMutations
subpath: pota/use/mutation
topic: Observers
desc: Signal accessor of the latest MutationRecords for a node.
---

# useMutations

`useMutations(node, init?)` returns a signal accessor that updates
with each batch of `MutationRecord`s observed on `node`. It is the
reactive half of the [`pota/use/mutation`](/use/mutation) emitter
pair; for a plain callback use
[`onMutations`](/use/mutation/onMutations), and to attach an observer
declaratively use [`mutated`](/use/mutation/mutated). The default
`init` is `{ childList: true, subtree: true }`.

## Arguments

| Argument | Type                   | Description                                                |
| -------- | ---------------------- | ---------------------------------------------------------- |
| `node`   | `Node`                 | Element to observe.                                        |
| `init`   | `MutationObserverInit` | Optional observer config; defaults to childList + subtree. |

**Returns:** a signal accessor (reader function) holding the latest
`MutationRecord[]` batch.

## Examples

### Read mutations reactively

Read the latest batch of records inside an effect; it re-runs whenever
the node mutates.

```jsx
import { useMutations } from 'pota/use/mutation'

const records = useMutations(node)
effect(() => console.log(records()))
```
