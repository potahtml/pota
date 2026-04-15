import { memo, signal } from '../lib/reactive.js'
import { getValue, toArray } from '../lib/std.js'

/**
 * @typedef {object} PaginatePage
 * @property {SignalAccessor<unknown[]>} items - The sliced items
 * @property {SignalAccessor<number>} currentPage - The page number
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
 * @returns {PaginatePage}
 */

export function paginateValues(items, numPerPage) {
	const rows = memo(() => toArray(getValue(items).values()))

	const options = {
		numPerPage,
		numItems: memo(() => rows().length),
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
 * @param {(start: number, end: number) => unknown[]} fetch - Function
 *   to get items from
 * @param {object} options
 * @param {Accessor<number>} options.numPerPage - How many items are
 *   displayed at the same time
 * @param {Accessor<number>} options.numItems - How many items there
 *   are in total
 * @returns {PaginatePage}
 */
export function paginate(fetch, options) {
	const [page, , pageUpdate] = signal(0)

	const totalPages = memo(() =>
		Math.max(
			0,
			Math.ceil(
				/** @type {number} */ (getValue(options.numItems)) /
					/** @type {number} */ (
						getValue(options.numPerPage)
					),
			),
		),
	)

	const currentPage = memo(() =>
		Math.min(page(), Math.max(0, totalPages() - 1)),
	)

	const hasPrevious = () => currentPage() > 0
	const hasNext = () => currentPage() + 1 < totalPages()

	return {
		items: memo(() => {
			const numPerPage = getValue(options.numPerPage)
			const start = currentPage() * numPerPage
			return fetch(start, start + numPerPage)
		}),
		currentPage: () => currentPage() + 1,
		totalPages,
		hasNext,
		next: () =>
			hasNext() && pageUpdate(value => value + 1),
		hasPrevious,
		previous: () =>
			hasPrevious() && pageUpdate(value => value - 1),
	}
}
