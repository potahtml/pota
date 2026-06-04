---
title: getValueElement
subpath: pota/use/dom
topic: Internals
desc: Resolve a possibly-function value to a Node (or undefined).
---

# getValueElement

`getValueElement(value, ...args)` resolves a possibly-function value
to a `Node` (or `undefined`). When `value` is a function it is called
with `...args`; the result is returned only when it is a `Node`,
otherwise the result is `undefined`. Part of
[`pota/use/dom`](/use/dom).
