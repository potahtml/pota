---
title: selection
subpath: pota/use/selection
topic: Interaction
desc: Select-all-on-click ref plus Range round-trip helpers.
---

# `pota/use/selection`

`pota/use/selection` covers two needs: the
[`clickSelectsAll`](/use/selection/clickSelectsAll) ref function that
selects an element's text on click, and
[`getSelection`](/use/selection/getSelection) /
[`restoreSelection`](/use/selection/restoreSelection) for
round-tripping a `Range` (used internally by [`use:bind`](/use/bind)
to keep `contenteditable` cursors stable across re-renders).

## Exports

- [`clickSelectsAll`](/use/selection/clickSelectsAll) — `use:ref`
  function: select all text on click
- [`getSelection()`](/use/selection/getSelection) — snapshot the
  current selection as a `Range`
- [`restoreSelection(range)`](/use/selection/restoreSelection) —
  reapply a captured `Range`
