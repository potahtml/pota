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
  currentPage,   // signal accessor    — clamped to [1, totalPages]
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

Page over data fetched on demand: `fetch(start, end)` returns the
current slice (here a `Promise`), and the `items` derived resolves it
as the page changes.

```jsx
import { paginate } from 'pota/use/paginate'

const { items, currentPage, totalPages, next, previous } = paginate(
	(start, end) =>
		fetch(`/api/rows?from=${start}&to=${end}`).then(r => r.json()),
	{
		numPerPage: () => 20,
		numItems: () => 1_000,
	},
)
```

### External page source

Pass `options.page` (an accessor) when the current page lives in a URL
search param or some other tracked source. Updates from that source
clobber any prior `next` / `previous` writes — the external source
becomes the authority.

```jsx
import { paginate } from 'pota/use/paginate'
import { location } from 'pota/use/location'

const page = () => Number(location.searchParams.page) || 1

const fetchRows = (start, end) =>
	fetch(`/api/rows?from=${start}&to=${end}`).then(r => r.json())

const { items, currentPage, hasNext, next } = paginate(fetchRows, {
	numPerPage: () => 25,
	numItems: () => 1_000,
	page,
})
```
