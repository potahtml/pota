---
title: form
subpath: pota/use/form
topic: Forms
desc:
  Form ergonomics — ref functions for input behaviors plus helpers to
  read and write form state.
---

# `pota/use/form`

`pota/use/form` covers form ergonomics: four bare ref functions for
common input behaviors, plus imperative helpers for reading and
writing form state (`form2object`, `object2form`, `isDisabled`,
`isEditable`) and a `focusNextInput` stepper.

## Exports

- [`clickFocusChildrenInput`](/use/form/clickFocusChildrenInput) —
  ref: clicking the element focuses its first focusable descendant
- [`enterFocusNext`](/use/form/enterFocusNext) — ref: `Enter` advances
  focus to the next form element
- [`preventEnter`](/use/form/preventEnter) — ref: block `Enter` from
  newline / submit
- [`sizeToInput`](/use/form/sizeToInput) — ref: grow / shrink a
  textarea to fit its content
- [`isDisabled(node)`](/use/form/isDisabled) — is the element
  `:disabled` (incl. ancestor `<fieldset disabled>`)?
- [`isEditable(node)`](/use/form/isEditable) — is the user typing into
  this element?
- [`focusNextInput(node, event)`](/use/form/focusNextInput) — the
  stepper behind `enterFocusNext`
- [`form2object(form, object?, submitter?)`](/use/form/form2object) —
  collect a form into a plain object (optionally merging into an
  existing one)
- [`object2form(form, values)`](/use/form/object2form) — write values
  back into a form
