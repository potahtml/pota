---
title: keyboard
subpath: pota/use/keyboard
topic: Input
desc: Ref factories for keyboard chords, plus held-key state.
---

# `pota/use/keyboard`

`pota/use/keyboard` exports ref factories for keyboard chords:
[`shortcut`](/use/keyboard/shortcut) scopes to the element,
[`globalShortcut`](/use/keyboard/globalShortcut) listens on the
document, and [`submitOnCtrlEnter`](/use/keyboard/submitOnCtrlEnter)
is a convenience for textareas — plus
[`useKeyHeld`](/use/keyboard/useKeyHeld) /
[`keysHeld`](/use/keyboard/keysHeld) for tracking held keys.

Chords are a `+`-separated list of modifiers — `ctrl`, `meta`, `alt`,
`shift`, plus the alias `mod` (`ctrl` on non-Mac, `meta` on Mac) —
followed by a single key. Matching is strict: `ctrl+s` does _not_ fire
on `ctrl+shift+s`. The handler is called with the `KeyboardEvent`;
`preventDefault` is applied automatically when the chord matches.

## Exports

- [`shortcut(combo, fn)`](/use/keyboard/shortcut) — element-scoped
  `use:ref` chord
- [`globalShortcut(combo, fn)`](/use/keyboard/globalShortcut) —
  document-scoped chord
- [`submitOnCtrlEnter(fn)`](/use/keyboard/submitOnCtrlEnter) —
  Ctrl/Cmd+Enter convenience for textareas
- [`useKeyHeld(key)`](/use/keyboard/useKeyHeld) — reactive boolean: is
  a key held?
- [`keysHeld()`](/use/keyboard/keysHeld) — live, non-reactive
  `Set<string>` of held keys
