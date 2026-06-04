---
title: setAttribute
subpath: pota/use/dom
topic: Internals
desc: The platform setAttribute on a node.
---

# setAttribute

`setAttribute(node, name, value)` is the platform `setAttribute` on
`node`. Its companions are [`hasAttribute`](/use/dom/hasAttribute) and
[`removeAttribute`](/use/dom/removeAttribute). Prefer JSX attributes —
this is an imperative escape hatch. Part of
[`pota/use/dom`](/use/dom).

## Arguments

| Argument | Type      | Description            |
| -------- | --------- | ---------------------- |
| `node`   | `Element` | The element to mutate. |
| `name`   | `string`  | Attribute name.        |
| `value`  | `string`  | Attribute value.       |
