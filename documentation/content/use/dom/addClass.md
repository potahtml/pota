---
title: addClass
subpath: pota/use/dom
topic: Internals
desc: classList.add from a string or array; no-ops on empty input.
---

# addClass

`addClass(node, className)` adds CSS classes to an element from a
string or array; no-ops on empty input. A string is split by
whitespace via [`tokenList`](/use/dom/tokenList) before being passed
to `classList.add(...tokens)`; an array is spread directly. The
inverse is [`removeClass`](/use/dom/removeClass). Part of
[`pota/use/dom`](/use/dom).

## Arguments

| Argument    | Type                 | Description                                      |
| ----------- | -------------------- | ------------------------------------------------ |
| `node`      | `Element`            | The element to add classes to.                   |
| `className` | `string \| string[]` | Space-separated string or array of class tokens. |
