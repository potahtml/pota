---
title: createElement
subpath: pota/use/dom
topic: Internals
desc: document.createElement, pre-bound to document.
---

# createElement

`createElement` is
[`document.createElement`](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement),
pre-bound to `document` so it can be passed around and called without
a receiver. Returns `undefined` when there is no `document`
(non-browser environment). Part of [`pota/use/dom`](/use/dom).

## Arguments

| Argument  | Type                     | Description                                  |
| --------- | ------------------------ | -------------------------------------------- |
| `tagName` | `string`                 | The HTML tag name of the element to create.  |
| `options` | `ElementCreationOptions` | Optional; e.g. `{ is }` for custom elements. |

**Returns:** `HTMLElement` — the newly created element.
