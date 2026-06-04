---
title: lazyImage
subpath: pota/use/intersection
topic: Observers
desc:
  use:ref factory that lazy-loads an <img> when it enters the
  viewport.
---

# lazyImage

`lazyImage()` is a one-shot `use:ref` factory for `<img>`: it swaps
`src` from `data-src` (or `opts.src`) the first time the element
enters the viewport, then disconnects the observer. Pass `rootMargin`
to start loading before the image scrolls in. Unlike the
shared-observer [`visible`](/use/intersection/visible) /
[`onVisible`](/use/intersection/onVisible) pair, each `lazyImage`
creates its own observer and tears it down on cleanup. Part of
[`pota/use/intersection`](/use/intersection).

## Arguments

`lazyImage(opts?)` takes a single options object:

| Option       | Type     | Description                                                                       |
| ------------ | -------- | --------------------------------------------------------------------------------- |
| `src`        | `string` | Source to load. Falls back to the element's `data-src` when omitted.              |
| `rootMargin` | `string` | Forwarded to `IntersectionObserver` to start loading before the image scrolls in. |

**Returns:** a `use:ref` factory `(node: HTMLImageElement) => void`.

## Examples

### Lazy-loading images

Defers each image's network request until it nears the viewport. The
real URL lives in `data-src`; `lazyImage` copies it into `src` on
first intersection.

```jsx
import { render } from 'pota'
import { lazyImage } from 'pota/use/intersection'

function Gallery() {
	const urls = [
		'https://picsum.photos/seed/a/600/300',
		'https://picsum.photos/seed/b/600/300',
		'https://picsum.photos/seed/c/600/300',
	]
	return (
		<div>
			{urls.map(url => (
				<img
					data-src={url}
					alt=""
					width="600"
					height="300"
					style={{ display: 'block', margin: '2rem 0' }}
					use:ref={lazyImage({ rootMargin: '200px' })}
				/>
			))}
		</div>
	)
}

render(Gallery)
```
