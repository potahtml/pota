---
title: walkElements
subpath: pota/use/dom
topic: Internals
desc: Depth-first element walk using a shared TreeWalker.
---

# walkElements

`walkElements(node, max?, nodes?)` performs a depth-first element walk
using a shared `TreeWalker`, including `node` itself when it's an
element. The walker is pre-bound, so callers pass only the starting
`node`. Used by the renderer's partial-instantiation path. Part of
[`pota/use/dom`](/use/dom).

## Arguments

| Argument | Type     | Description                                                    |
| -------- | -------- | -------------------------------------------------------------- |
| `node`   | `Node`   | Starting node; included in the result when it is an element.   |
| `max`    | `number` | Stop after collecting this many nodes. Defaults to `Infinity`. |
| `nodes`  | `Node[]` | Accumulator to push into. Defaults to a fresh `[]`.            |

**Returns:** `Node[]` — the collected element nodes (the same `nodes`
array, mutated).
