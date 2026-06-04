---
title: removeClass
subpath: pota/use/dom
topic: Internals
desc: classList.remove from a string or array; no-ops on empty input.
---

# removeClass

`removeClass(node, strOrArray)` splits a string by whitespace via
[`tokenList`](/use/dom/tokenList) (or uses the array directly), then
calls `classList.remove(...tokens)`. No-ops on empty input. The
inverse is [`addClass`](/use/dom/addClass). Part of
[`pota/use/dom`](/use/dom).
