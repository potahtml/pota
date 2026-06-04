---
title: removeEventNative
subpath: pota/use/event
topic: Events
desc: removeEventListener wrapper matching addEventNative.
---

# removeEventNative

`removeEventNative` is the counterpart to
[`addEventNative`](/use/event/addEventNative) — a thin wrapper over
`removeEventListener` that accepts the same function-or-object
handler. Pass the exact handler reference you added. Part of
[`pota/use/event`](/use/event).

## Examples

### Detach a native listener

Attaches a `resize` listener on `window` and removes it later by
passing the exact same handler reference.

```jsx
import { addEventNative, removeEventNative } from 'pota/use/event'

const onResize = () => console.log(window.innerWidth)

addEventNative(window, 'resize', onResize)
// later:
removeEventNative(window, 'resize', onResize)
```
