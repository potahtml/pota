---
title: focus
subpath: pota/use/focus
topic: Interaction
desc:
  Per-element focus ref functions, document focus state, and focus
  traversal.
---

# `pota/use/focus`

`pota/use/focus` covers per-element focus ergonomics as ref functions
([`autoFocus`](/use/focus/autoFocus),
[`selectOnFocus`](/use/focus/selectOnFocus),
[`trapFocus`](/use/focus/trapFocus)), plus document-level focus state
through an emitter ([`useDocumentFocus`](/use/focus/useDocumentFocus)
/ [`onDocumentFocus`](/use/focus/onDocumentFocus)) and standalone
focus traversal helpers ([`focusNext`](/use/focus/focusNext) /
[`focusPrevious`](/use/focus/focusPrevious)).

## Exports

- [`autoFocus`](/use/focus/autoFocus) — `use:ref`: focus on mount
- [`selectOnFocus`](/use/focus/selectOnFocus) — `use:ref`: select-all
  on focus
- [`trapFocus`](/use/focus/trapFocus) — `use:ref`: modal-style Tab
  containment
- [`focusNext(list?)`](/use/focus/focusNext) /
  [`focusPrevious(list?)`](/use/focus/focusPrevious) — imperative
  traversal with wrap-around
- [`useDocumentFocus()`](/use/focus/useDocumentFocus) — signal
  accessor: does the document have focus?
- [`onDocumentFocus(fn)`](/use/focus/onDocumentFocus) — callback on
  focus / blur
