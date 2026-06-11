---
title: createTreeWalker
subpath: pota/use/dom
topic: Internals
desc: document.createTreeWalker, pre-bound to document.
---

# createTreeWalker

`createTreeWalker` is
[`document.createTreeWalker`](https://developer.mozilla.org/en-US/docs/Web/API/Document/createTreeWalker),
pre-bound to `document`. It builds a `TreeWalker` for depth-first
traversal of a subtree. The export itself is `undefined` when there
is no `document` (non-browser environment).
[walkElements](/use/dom/walkElements) uses a shared element-only
walker built this way. Part of [`pota/use/dom`](/use/dom).

## Arguments

| Argument     | Type         | Description                                                      |
| ------------ | ------------ | ---------------------------------------------------------------- |
| `root`       | `Node`       | The root node of the subtree to walk.                            |
| `whatToShow` | `number`     | Optional bitmask of `NodeFilter` constants, e.g. `SHOW_ELEMENT`. |
| `filter`     | `NodeFilter` | Optional callback or object to accept/reject visited nodes.      |

**Returns:** `TreeWalker` — a walker positioned at `root`.
