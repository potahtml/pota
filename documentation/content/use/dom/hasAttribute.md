---
title: hasAttribute
subpath: pota/use/dom
topic: Internals
desc: The platform hasAttribute on a node.
---

# hasAttribute

`hasAttribute(node, name)` is the platform `hasAttribute` on `node`,
returning `true` when the attribute is present. Its companions are
[`setAttribute`](/use/dom/setAttribute) and
[`removeAttribute`](/use/dom/removeAttribute). Prefer JSX attributes —
this is an imperative escape hatch. Part of
[`pota/use/dom`](/use/dom).
