---
title: onVisible
subpath: pota/use/intersection
topic: Observers
desc: Side-effect callback for an element's intersection changes.
---

# onVisible

When you already have a ref to a node, `onVisible(node, fn, opts?)`
calls `fn` with each real `IntersectionObserverEntry` — the
side-effect half of the [`pota/use/intersection`](/use/intersection)
emitter pair. For a reactive accessor use
[`useVisible`](/use/intersection/useVisible); to attach an observer
declaratively use [`visible`](/use/intersection/visible).

`fn` is never invoked with the pre-observer placeholder: the emitter
emits `undefined` before the first real entry arrives, and `onVisible`
filters that out. With `opts.once` the subscription auto-unsubscribes
after the first entry where `isIntersecting` is `true`; entries that
fire on exit are ignored.

## Arguments

| Argument | Type                                            | Description                                                                                        |
| -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `node`   | `Element`                                       | Element to observe.                                                                                |
| `fn`     | `(entry: IntersectionObserverEntry) => void`    | Called on each real intersection change.                                                           |
| `opts`   | `IntersectionObserverInit & { once?: boolean }` | Optional. Standard `root` / `rootMargin` / `threshold`, plus `once` to fire only on first arrival. |

**Returns:** `void`.

## Examples

### Subscribe to intersection

Logs whenever the node enters or leaves the viewport. `entry` is
always a real `IntersectionObserverEntry`.

```jsx
import { render, signal } from 'pota'
import { onVisible } from 'pota/use/intersection'

function Panel() {
	const node = signal()

	onVisible(node.read(), entry =>
		console.log('visible:', entry.isIntersecting),
	)

	return (
		<div
			use:ref={node.write}
			style={{ height: '120vh' }}
		>
			scroll me
		</div>
	)
}

render(Panel)
```

### Fire once on first arrival

With `once`, `fn` runs a single time — the first entry where
`isIntersecting` is `true` — then auto-unsubscribes. Exit entries
before that are ignored.

```jsx
import { render, signal } from 'pota'
import { onVisible } from 'pota/use/intersection'

function RevealOnce() {
	const node = signal()
	const seen = signal(false)

	onVisible(node.read(), () => seen.write(true), { once: true })

	return (
		<div
			use:ref={node.write}
			style={{ height: '40vh' }}
		>
			{() => (seen.read() ? 'arrived' : 'scroll me into view')}
		</div>
	)
}

render(RevealOnce)
```
