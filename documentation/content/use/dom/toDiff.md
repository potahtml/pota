---
title: toDiff
subpath: pota/use/dom
topic: Internals
desc:
  Remove DOM elements in prev that aren't in next — for <For/>
  reconciliation.
---

# toDiff

`toDiff(prev, next, short?)` removes from the DOM any element in
`prev` that isn't in `next` — used by the `map` / `<For/>`
reconciliation. It **only removes**; placement and reordering are
handled by the smart loop in `map()`. Part of
[`pota/use/dom`](/use/dom).

## Arguments

| Argument | Type           | Description                                                                     |
| -------- | -------------- | ------------------------------------------------------------------------------- |
| `prev`   | `DOMElement[]` | Previously rendered elements. Defaults to `[]`.                                 |
| `next`   | `DOMElement[]` | Elements to keep. Anything in `prev` but not here is removed. Defaults to `[]`. |
| `short`  | `boolean`      | Enable the fast-clear path when `next` is empty. Defaults to `false`.           |

**Returns:** `DOMElement[]` — the `next` array, unchanged.
