---
title: createElementNS
subpath: pota/use/dom
topic: Internals
desc: document.createElementNS, pre-bound to document.
---

# createElementNS

`createElementNS` is
[`document.createElementNS`](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElementNS),
pre-bound to `document`. Use it to create namespaced elements such as
SVG or MathML. Returns `undefined` when there is no `document`
(non-browser environment). Part of [`pota/use/dom`](/use/dom).

## Arguments

| Argument        | Type                     | Description                                               |
| --------------- | ------------------------ | --------------------------------------------------------- |
| `namespaceURI`  | `string`                 | The namespace, e.g. `http://www.w3.org/2000/svg`.         |
| `qualifiedName` | `string`                 | The qualified tag name of the element to create.          |
| `options`       | `ElementCreationOptions` | Optional; e.g. `{ is }` for customized built-in elements. |

**Returns:** `Element` — the newly created namespaced element.
