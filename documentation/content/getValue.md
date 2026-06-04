---
title: getValue
subpath: pota
topic: Utilities
desc:
  Unwrap a value by calling it until it is no longer a function, then
  return the result.
---

# getValue

Unwrap a value by calling it until it is no longer a function, then
return the result. It accepts a plain value, a signal reader, a
[memo](/memo) accessor, or any nested function-of-function. Useful
when authoring components or plugins that take an `Accessor<T>` /
`T | (() => T)` prop and want a single shape to work with.

## Arguments

| name    | type           | description                                    |
| ------- | -------------- | ---------------------------------------------- |
| `value` | `T \| () => T` | A plain value or a (possibly nested) accessor. |

**Returns:** `T` — the fully unwrapped value.

## Examples

### Unwrapping any accessor shape

Resolves the same helper across a plain value, a signal reader, a
memo-style function, and a deeply nested chain of functions.

```jsx
import { getValue, signal } from 'pota'

const a = signal(1)
const b = () => a.read() * 2

console.log(getValue(42)) // 42 (plain)
console.log(getValue(a.read)) // 1 (signal)
console.log(getValue(b)) // 2 (memo-style)
console.log(getValue(() => () => () => 'deep')) // 'deep'
```
