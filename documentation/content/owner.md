---
title: owner
subpath: pota
topic: Reactive core
desc:
  Returns the currently-running reactive owner — the scope cleanups
  and child computations attach to.
---

# owner

Returns the currently-running reactive _owner_ — the scope that
cleanups and child computations attach to — or `undefined` when called
outside any reactive scope. Sibling to [listener](/listener) (the
tracking scope); both are low-level introspection helpers. Most app
code never touches them.

## Arguments

`owner()` takes no arguments.

**Returns:** the active `Computation`, or `undefined` outside a
reactive scope. [cleanup](/cleanup) registrations attach here; child
[effect](/effect) / [memo](/memo) / [root](/root) instances become its
children.

## Capture an owner to schedule work later

Pair with [owned](/owned) or `runWithOwner` when you need to run a
callback inside a previously-captured scope — typically when the
callback fires from outside any reactive scope (a DOM event from a
library, a queued microtask). [owned](/owned) captures `owner()` for
you, so reach for it directly unless you need the raw scope.

```js
import { owned } from 'pota'

const cb = owned(() => {
	// ...runs under the owner that was active when owned() was called
})

externalLibrary.on('event', cb)
```

## vs listener

`owner` is about _lifetime_ — what disposes when;
[listener](/listener) is about _tracking_ — whether signal reads
subscribe. The two are usually the same `Computation`, but
[untrack](/untrack) sets `listener` to `undefined` while leaving
`owner` intact, and [root](/root) creates a new owner without a
listener.
