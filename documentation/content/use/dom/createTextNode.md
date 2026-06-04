---
title: createTextNode
subpath: pota/use/dom
topic: Internals
desc: document.createTextNode, pre-bound to document.
---

# createTextNode

`createTextNode` is
[`document.createTextNode`](https://developer.mozilla.org/en-US/docs/Web/API/Document/createTextNode),
pre-bound to `document`. Returns `undefined` when there is no
`document` (non-browser environment). Part of
[`pota/use/dom`](/use/dom).

## Arguments

| Argument | Type     | Description                            |
| -------- | -------- | -------------------------------------- |
| `data`   | `string` | The text content of the new text node. |

**Returns:** `Text` — the newly created text node.
