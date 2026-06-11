---
title: visible
subpath: pota/use/intersection
topic: Observers
desc: use:ref factory firing on IntersectionObserver changes.
---

# visible

Attach `visible(handler)` with `use:ref` and the handler fires with
each `IntersectionObserverEntry` change. The second argument is
forwarded to `IntersectionObserver` as the options bag (`root`,
`rootMargin`, `threshold`), plus a pota-specific `once`: when `true`,
the handler fires once on the first entry where `isIntersecting` is
`true` and later entries are ignored — handy for reveal-on-scroll
styles that only need to flip a class once. It is the declarative `use:ref`
form of [`onVisible`](/use/intersection/onVisible). Part of
[`pota/use/intersection`](/use/intersection).

## Arguments

| Argument  | Type                                            | Description                                                                               |
| --------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `handler` | `(entry: IntersectionObserverEntry) => void`    | Called with each real intersection change.                                                |
| `opts`    | `IntersectionObserverInit & { once?: boolean }` | Optional. `root` / `rootMargin` / `threshold`, plus `once` to fire only on first arrival. |

**Returns:** a ref function `(node: Element) => void` for `use:ref`.

## Examples

### Reveal-on-scroll

Flips each card's background the first time it scrolls into view. The
handler writes a signal on intersection and the reactive `style` value
reads it back.

```jsx
import { render, signal } from 'pota'
import { visible } from 'pota/use/intersection'

function Card({ index }) {
	const seen = signal(false)

	return (
		<div
			use:ref={visible(
				entry => entry.isIntersecting && seen.write(true),
			)}
			style={{
				height: '40vh',
				margin: '2rem 0',
				background: () => (seen.read() ? 'mediumseagreen' : '#222'),
				color: 'white',
				display: 'grid',
				'place-items': 'center',
			}}
		>
			card #{index} —{' '}
			{() => (seen.read() ? 'in view' : 'scroll me into view')}
		</div>
	)
}

render(
	<div>
		{[1, 2, 3, 4].map(i => (
			<Card index={i} />
		))}
	</div>,
)
```
