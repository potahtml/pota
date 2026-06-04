---
title: childNodes
subpath: pota/use/test
topic: Internals
desc: childNodes.length of a node, defaulting to document.body.
---

# childNodes

`childNodes(node?)` returns `node.childNodes.length`, defaulting to
`document.body`. A quick way to assert how many children a container
rendered. Part of [`pota/use/test`](/use/test).

## Arguments

| Argument | Type   | Description                                              |
| -------- | ------ | -------------------------------------------------------- |
| `node`   | `Node` | The parent node to inspect. Defaults to `document.body`. |

**Returns:** the `number` of child nodes.
