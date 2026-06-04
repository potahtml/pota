---
title: addEventNative
subpath: pota/use/event
topic: Events
desc:
  addEventListener wrapper that accepts a handler object as its
  options.
---

# addEventNative

`addEventNative` is a thin wrapper over `addEventListener` that
accepts either a plain function or a handler object — when an object
is passed, the object itself doubles as the options bag. Use it for
listeners outside of a JSX element (window / document /
manually-acquired nodes); pair with
[`passiveEvent`](/use/event/passiveEvent) for a passive listener and
[`removeEventNative`](/use/event/removeEventNative) to detach. Part of
[`pota/use/event`](/use/event).

## Examples

### Attaching and detaching a passive listener

Registers a passive `wheel` listener on `window`, then removes it with
the same handler reference. Passing a
[passiveEvent](/use/event/passiveEvent) object hands the options bag
and the handler to `addEventListener` in one go.

```jsx
import {
	addEventNative,
	removeEventNative,
	passiveEvent,
} from 'pota/use/event'

const handler = passiveEvent(e => console.log('wheel', e.deltaY))

addEventNative(window, 'wheel', handler)
// later:
removeEventNative(window, 'wheel', handler)
```
