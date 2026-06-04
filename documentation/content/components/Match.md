---
title: Match
kind: component
subpath: pota/components
topic: Flow
desc: A branch for <Switch/> — carries a when condition and children.
---

# `<Match/>`

`<Match/>` is a branch for [`<Switch/>`](/components/Switch): it
carries a `when` condition and the children to render. By itself
`Match` is an identity component — its job is to carry the `when` and
`children` props that `Switch` reads. Like
[`<Show/>`](/components/Show), when its child is a function it is
invoked with the matched value (reactively).

## Attributes

| name   | type | description                                                                                                                                    |
| ------ | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `when` | any  | once `when` becomes truthy, it will show its children. A `<Match/>` without `when` becomes the implicit fallback when no other branch matches. |

## Match as default branch

A `<Match/>` without `when` becomes the implicit fallback inside
[`<Switch/>`](/components/Switch) — equivalent to setting the `Switch`
`fallback` prop. See the [`<Switch/>`](/components/Switch) examples
for matching, default branches, and discriminated unions.
