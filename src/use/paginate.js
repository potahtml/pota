import { derived, memo } from '../lib/reactive.js'
import { getValue, toArray } from '../lib/std.js'

/**
 * @typedef {object} PaginatePage
 * @property {Derived<unknown[]>} items - The sliced items. Backed by
 *   a `Derived`, so `fetch` may return a Promise; `items()` reports
 *   the `nothing` sentinel while pending and the resolved array
 *   afterwards. `await items` / `isResolved(items)` work as for any
 *   derived.
 * @property {Derived<number>} page - Writable raw page cursor
 *   (1-based). `next`/`previous` and external code both write here;
 *   reading returns the last value written, which may exceed
 *   `totalPages` (intent is preserved across `numItems` /
 *   `numPerPage` changes).
 * @property {SignalAccessor<number>} currentPage - The page number
 *   actually rendered, clamped to `[1, max(1, totalPages)]`
 * @property {SignalAccessor<number>} totalPages - Amount of pages
 * @property {() => boolean} hasNext - Returns a boolean indicating if
 *   has a next page
 * @property {() => void} next - To go to next page updating the items
 * @property {() => boolean} hasPrevious - Returns a boolean
 *   indicating if has a previous page
 * @property {() => void} previous - To go to prev page updating the
 *   items
 */

/**
 * Paginates `items` and provides "prev" and "next" functions to use
 * on pagination buttons
 *
 * @param {Accessor<{ values(): Iterable<unknown> }>} items - List of
 *   items to paginate
 * @param {Accessor<number>} numPerPage - How many to display at the
 *   same time
 * @param {Accessor<number>} [page] - Optional source for the current
 *   page (1-based). Same semantics as `paginate`'s `options.page`:
 *   when an accessor reading a tracked signal is passed, source
 *   updates clobber `next`/`previous` writes.
 * @returns {PaginatePage}
 */

export function paginateValues(items, numPerPage, page) {
	const rows = memo(() => toArray(getValue(items).values()))

	const options = {
		numPerPage,
		numItems: memo(() => rows().length),
		page,
	}

	const fetch = (start, end) => {
		return rows().slice(start, end)
	}
	return paginate(fetch, options)
}

/**
 * Paginates items and provides "prev" and "next" functions to use on
 * pagination buttons
 *
 * @param {(start: number, end: number) => unknown[] | Promise<unknown[]>} fetch -
 *   Function to get items from. May return synchronously or as a
 *   Promise; the `items` derived resolves accordingly.
 * @param {object} options
 * @param {Accessor<number>} options.numPerPage - How many items are
 *   displayed at the same time
 * @param {Accessor<number>} options.numItems - How many items there
 *   are in total
 * @param {Accessor<number>} [options.page] - Optional source for the
 *   current page (1-based). When passed an accessor that reads a
 *   tracked signal (e.g. a URL search param), the derived re-runs on
 *   change and clobbers any prior write from `next`/`previous`,
 *   making the source the authority.
 * @returns {PaginatePage}
 */
export function paginate(fetch, options) {
	const page = derived(
		/** @type {() => number} */ (() => options.page || 1),
	)

	const totalPages = memo(() =>
		Math.max(
			0,
			Math.ceil(
				/** @type {number} */ (getValue(options.numItems)) /
					/** @type {number} */ (getValue(options.numPerPage)),
			),
		),
	)

	const currentPage = memo(() =>
		Math.max(1, Math.min(page(), totalPages())),
	)

	const hasPrevious = () => currentPage() > 1
	const hasNext = () => currentPage() < totalPages()

	return {
		items: derived(() => {
			const numPerPage = getValue(options.numPerPage)
			const start = (currentPage() - 1) * numPerPage
			return fetch(start, start + numPerPage)
		}),
		page,
		currentPage,
		totalPages,
		hasNext,
		next: () => hasNext() && page(page() + 1),
		hasPrevious,
		previous: () => hasPrevious() && page(page() - 1),
	}
}
