import { memo, signal } from '../lib/reactive.js'
import { getValue, toArray } from '../lib/std.js'

/**
 * @typedef {object} PaginatePage
 * @property {Accessor<unknown[]>} items - The sliced items
 * @property {Accessor<number>} currentPage - The page number
 * @property {Accessor<number>} totalPages - Amount of pages
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
 * @param {Accessor<unknown[]>} items - List of items to paginate
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
 * @param {(start, end) => Accessor<unknown[]>} fetch - Function to
 *   get items from
 * @param {object} options
 * @param {Accessor<number>} options.numPerPage - How many items are
 *   displayed at the same time
 * @param {Accessor<number>} options.numItems - How many items there
 *   are in total
 * @returns {PaginatePage}
 */
export function paginate(fetch, options) {
	const [page, pageSet, pageUpdate] = signal(0)

	const totalPages = memo(() => {
		const pages = Math.ceil(
			getValue(options.numItems) / getValue(options.numPerPage),
		)
		if (page() > pages) pageSet(pages)
		return pages
	})

	const hasPrevious = () => page() !== 0
	const hasNext = () => page() + 1 < totalPages()

	return {
		items: memo(() => {
			const numPerPage = getValue(options.numPerPage)
			const start = page() * numPerPage
			return fetch(start, start + numPerPage)
		}),
		currentPage: () => page() + 1,
		totalPages,
		hasNext,
		next: () => hasNext() && pageUpdate(value => value + 1),
		hasPrevious,
		previous: () => hasPrevious() && pageUpdate(value => value - 1),
	}
}
