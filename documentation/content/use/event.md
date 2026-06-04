---
title: event
subpath: pota/use/event
topic: Events
desc:
  Low-level DOM event helpers — stop helpers, emit, waitEvent, native
  listeners.
---

# `pota/use/event`

`pota/use/event` collects small, low-level helpers for working with
DOM events: stop helpers you can drop into `on:*` handlers, a
`CustomEvent` emitter, a promise-based `waitEvent`, and explicit
`addEventListener` / `removeEventListener` wrappers that accept
options objects. (For JSX events the `on:*` prop is already idiomatic
— reach here for listeners on window / document / manually-acquired
nodes.)

## Exports

- [`preventDefault(e)`](/use/event/preventDefault) /
  [`stopPropagation(e)`](/use/event/stopPropagation) /
  [`stopImmediatePropagation(e)`](/use/event/stopImmediatePropagation)
  — one-method stop helpers
- [`stopEvent(e)`](/use/event/stopEvent) — all three at once
- [`emit(node, name, init?)`](/use/event/emit) — dispatch a
  `CustomEvent`
- [`waitEvent(element, name)`](/use/event/waitEvent) — promise for the
  next matching event
- [`addEventNative`](/use/event/addEventNative) /
  [`removeEventNative`](/use/event/removeEventNative) —
  `addEventListener` wrappers with options support
- [`passiveEvent(fn)`](/use/event/passiveEvent) — wrap a handler as a
  passive listener
