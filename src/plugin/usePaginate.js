import { memo, signal } from '../lib/reactive.js'
import { getValue, toArray } from '../lib/std.js'

/**
 * @typedef {object} PaginatePage
 * @property {Signal} items - The sliced items
 * @property {Signal} currentPage - The page number
 * @property {Signal} totalPages - Amount of pages
 * @property {Signal} hasNext - Returns a boolean indicating if has a
 *   next page
 * @property {Signal} next - To go to next page updating the items
 * @property {Signal} hasPrevious - Returns a boolean indicating if
 *   has a previous page
 * @property {Signal} previous - To go to prev page updating the items
 */

/**
 * Paginates `items` and provides "prev" and "next" functions to use
 * on pagination buttons
 *
 * @param {any[] | Signal} items - List of items to paginate
 * @param {number} numPerPage - How many to display at the same time
 * @returns {PaginatePage} Page
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
 * @param {(start, end) => any | Signal} fetch - Function to get items
 *   from
 * @param {object} options
 * @param {object} options.numPerPage - How many items are displayed
 *   at the same time
 * @param {object} options.numItems - How many items there are in
 *   total
 * @returns {PaginatePage} Page
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
