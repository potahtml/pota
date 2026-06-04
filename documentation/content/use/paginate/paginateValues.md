---
title: paginateValues
subpath: pota/use/paginate
topic: Data
desc: Page an in-memory iterable (Array, Map, Set, store).
---

# paginateValues

`paginateValues(items, numPerPage, page?)` pages an in-memory
iterable: pass anything with `.values()` (Array, Map, Set, a reactive
store …) and a per-page count, and the slice updates whenever any of
those change. It returns the same shape as
[`paginate`](/use/paginate); reach for `paginate` instead when the
data lives behind a request.

Internally it materializes `items.values()` into an array, derives
`numItems` from its length, and delegates the slicing to `paginate`.

## Arguments

| Argument     | Type                                        | Description                                                       |
| ------------ | ------------------------------------------- | ----------------------------------------------------------------- |
| `items`      | `Accessor<{ values(): Iterable<unknown> }>` | Anything exposing `.values()` — Array, Map, Set, reactive store   |
| `numPerPage` | `Accessor<number>`                          | How many items are shown at once                                  |
| `page`       | `Accessor<number>` (optional)               | External 1-based page source; updates clobber `next` / `previous` |

**Returns:** the same `PaginatePage` shape as
[`paginate`](/use/paginate).

## Examples

### Paged list with prev / next controls

A reactive paged view over a plain array, with page indicator and
disabled-aware navigation buttons.

```jsx
import { render, signal } from 'pota'
import { For } from 'pota/components'
import { paginateValues } from 'pota/use/paginate'

const rows = Array.from({ length: 23 }, (_, i) => `row #${i + 1}`)

function App() {
	const perPage = signal(5)

	const {
		items,
		currentPage,
		totalPages,
		hasPrevious,
		hasNext,
		next,
		previous,
	} = paginateValues(() => rows, perPage.read)

	return (
		<div>
			<ul>
				<For each={items}>{row => <li>{row}</li>}</For>
			</ul>

			<p>
				page <strong>{currentPage}</strong> of{' '}
				<strong>{totalPages}</strong>
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
