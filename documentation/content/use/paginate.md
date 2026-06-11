---
title: paginate
subpath: pota/use/paginate
topic: Data
desc:
  Turn a fetch (or reactive iterable) into a paged view with page
  state and controls.
---

# `pota/use/paginate`

`pota/use/paginate` turns a fetch function (or a reactive iterable)
into a paged view: a slice of items, current page state, total pages,
and `next` / `previous` controls. Backed by `memo` / `derived`, so it
reacts to changes in `numPerPage`, `numItems`, or an external `page`
accessor. Its primary export is `paginate` (async fetch); for an
in-memory iterable use
[`paginateValues`](/use/paginate/paginateValues).

## Exports

- `paginate(fetch, options)` — async, fetch-backed pager (documented
  below)
- [`paginateValues(items, numPerPage, page?)`](/use/paginate/paginateValues)
  — page an in-memory iterable

## Arguments

`paginate(fetch, options)`:

| Argument             | Type                                              | Description                                                       |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| `fetch`              | `(start, end) => unknown[] \| Promise<unknown[]>` | Returns the slice for `[start, end)`; may resolve async           |
| `options.numPerPage` | `Accessor<number>`                                | How many items are shown at once                                  |
| `options.numItems`   | `Accessor<number>`                                | Total number of items, used to compute `totalPages`               |
| `options.page`       | `Accessor<number>` (optional)                     | External 1-based page source; updates clobber `next` / `previous` |

**Returns:** a `PaginatePage` object (see [Shape](#shape)).

## Shape

Both functions return the same object:

```js
{
  items,         // Derived<unknown[]> — the current slice (Promise-aware)
  page,          // Derived<number>    — writable raw cursor
  currentPage,   // signal accessor    — clamped to [1, max(1, totalPages)]
  totalPages,    // signal accessor
  hasNext,       // () => boolean
  hasPrevious,   // () => boolean
  next,          // () => void
  previous,      // () => void
}
```

`currentPage` is what you render; `page` is the raw cursor — writes to
it (by `next` / `previous` or externally) are preserved across changes
to `numItems` / `numPerPage`, but the clamped `currentPage` is what
slices the items.

## Examples

### paginate — async fetch

Page over data fetched on demand: `fetch(start, end)` may return a
`Promise`, and the Promise-aware `items` derived reports the pending
state — `isResolved(items)` is `false` until the slice arrives. Here a
delayed local slice stands in for the request.

```jsx
import { isResolved, render } from 'pota'
import { paginate } from 'pota/use/paginate'

const rows = Array.from({ length: 95 }, (_, i) => `row #${i + 1}`)

// stands in for a server request — resolves the slice after a delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const fetchRows = async (start, end) => {
	await delay(300)
	return rows.slice(start, end)
}

function App() {
	const {
		items,
		currentPage,
		totalPages,
		hasPrevious,
		hasNext,
		next,
		previous,
	} = paginate(fetchRows, {
		numPerPage: () => 10,
		numItems: () => rows.length,
	})

	return (
		<div>
			<p>
				page <strong>{currentPage}</strong> of{' '}
				<strong>{totalPages}</strong>
			</p>
			<p>
				{() => (isResolved(items) ? items().join(', ') : 'loading…')}
			</p>
			<button
				on:click={previous}
				disabled={() => !hasPrevious()}
			>
				prev
			</button>
			<button
				on:click={next}
				disabled={() => !hasNext()}
			>
				next
			</button>
		</div>
	)
}

render(App)
```

### External page source

Pass `options.page` (an accessor) when the current page lives in a URL
search param or some other tracked source. Updates from that source
clobber any prior `next` / `previous` writes — the external source
becomes the authority, so move between pages by updating the source
itself (here, [`navigate`](/use/location/navigate) to a new `?page=`)
rather than calling `next` / `previous`.

```jsx
import { paginate } from 'pota/use/paginate'
import { location, navigate } from 'pota/use/location'

const page = () => Number(location.searchParams.page) || 1

const fetchRows = (start, end) =>
	fetch(`/api/rows?from=${start}&to=${end}`).then(r => r.json())

const { items, currentPage, totalPages } = paginate(fetchRows, {
	numPerPage: () => 25,
	numItems: () => 1_000,
	page,
})

// move pages through the source, not `next`/`previous`
const goTo = n => navigate(`?page=${n}`)
```
