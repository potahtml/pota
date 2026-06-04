---
title: createComment
subpath: pota/use/dom
topic: Internals
desc:
  Create a comment node — the placeholder anchor for reactive ranges.
---

# createComment

`createComment(text)` creates a comment node — used as the placeholder
anchor for reactive ranges. It is `document.createComment` pre-bound
to `document`, so it can be passed around as a value. Part of
[`pota/use/dom`](/use/dom).

## Arguments

| Argument | Type     | Description                 |
| -------- | -------- | --------------------------- |
| `text`   | `string` | The comment's text content. |

**Returns:** `Comment` — the new comment node.
