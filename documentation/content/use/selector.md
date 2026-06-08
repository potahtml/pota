---
title: selector
subpath: pota/use/selector
topic: Reactive helpers
desc: Single-effect selection state, plus a previous-value wrapper.
---

# `pota/use/selector`

`pota/use/selector` provides small reactive helpers:
[`useSelector`](/use/selector/useSelector) builds derived selection
state from a source signal using a single shared effect (not one per
value), so it scales to long lists; and
[`usePrevious`](/use/selector/usePrevious) gives a function access to
its own previous return value.

## Exports

- [`useSelector(source)`](/use/selector/useSelector) — `isSelected`
  factory without O(n) updates
- [`usePrevious(fn)`](/use/selector/usePrevious) — wrap `fn` so it
  receives its previous return value
