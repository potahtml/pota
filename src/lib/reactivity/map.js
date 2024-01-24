// MAP

import { $map } from '../../constants.js'
import { getValue } from '../std/getValue.js'
import { groupBy } from '../std/groupBy.js'
import { removeFromArray } from '../std/removeFromArray.js'
import { cleanup, root, untrack } from './primitives/solid.js'

/**
 * Reactive Map
 *
 * @param {Each} list
 * @param {Function} callback
 * @param {boolean} [sort] - To reorder items in the document
 */
export function map(list, callback, sort) {
	const cache = new Map()
	const duplicates = new Map() // for when caching by value is not possible [1, 2, 1, 1, 1]

	let runId = 0

	let rows = []
	/** @type any[] */
	let prev = []

	function clear() {
		for (const row of prev) {
			row.dispose(true)
		}
		cache.clear()
		duplicates.clear()

		rows.length = 0
		prev.length = 0
	}

	// to get rid of all nodes when parent disposes
	cleanup(clear)

	/**
	 * Create an item
	 *
	 * @param {unknown} item
	 * @param {unknown} index
	 * @param {Function} fn
	 * @param {boolean} isDupe
	 */
	function create(item, index, fn, isDupe) {
		// a root is created so we can call dispose to get rid of an item
		return root(dispose => {
			/** @type Children[] */
			const nodes = fn
				? fn(callback(item, index), index)
				: callback(item, index)

			const row = {
				runId: -1,
				index,
				nodes,
				// reference nodes, it holds the placeholders that delimit `begin` and `end`
				// you can quickly check if items are in the right order
				// by checking if item.end === nextItem.begin.previousSibling
				begin: nodes[0],
				end: nodes[nodes.length - 1],
				dispose: all => {
					// skip cache deletion as we are going to clear the full map
					if (!all) {
						// delete from cache
						if (!isDupe) {
							cache.delete(item)
						} else {
							const arr = duplicates.get(item)
							arr.length === 1
								? duplicates.delete(item)
								: removeFromArray(arr, row)
						}
					}
					dispose()
				},
			}
			return row
		})
	}

	function nodesFromRow(row) {
		const begin = row.begin
		const end = row.end
		const nodes = [begin]

		let nextSibling = begin.nextSibling
		while (nextSibling !== end) {
			nodes.push(nextSibling)
			nextSibling = nextSibling.nextSibling
		}
		nodes.push(end)
		return nodes
	}

	/**
	 * @param {Function} fn
	 * @returns {Children[] | null}
	 */
	function mapper(fn) {
		const items = getValue(list) || []

		return untrack(() => {
			runId++
			rows = []

			for (const [index, item] of items.entries()) {
				let row = cache.get(item)

				// if the item doesnt exists, create it
				if (!row) {
					row = create(item, index, fn, false)
					cache.set(item, row)
				} else if (row.runId === runId) {
					// a map will save only 1 of any primitive duplicates, say: [1, 1, 1, 1]
					// if the saved value was already used on this run, create a new one
					let dupes = duplicates.get(item)
					if (!dupes) {
						dupes = []
						duplicates.set(item, dupes)
					}
					for (row of dupes) {
						if (row.runId !== runId) break
					}
					if (row.runId === runId) {
						row = create(item, index, fn, true)
						dupes.push(row)
					}
				}

				row.runId = runId // mark used on this run
				row.index = index // save sort order
				rows.push(row)
			}

			// remove rows that arent present on the current run
			if (rows.length === 0) {
				clear()
			} else {
				for (const row of prev) {
					if (row.runId !== runId) row.dispose()
				}
			}

			// reorder elements
			// `sort` because `map` doesnt need sorting
			// `rows.length > 1` because no need for sorting when there are no items
			// prev.length > 0 to skip sorting on creation as its already sorted
			if (sort && rows.length > 1 && prev.length > 0) {
				// if the planets align it handles swapping
				// a = sorted
				// b = unsorted
				const { a, b } = groupBy(rows, (value, index) =>
					rows[index] === prev[index] ? 'a' : 'b',
				)

				if (
					a &&
					b &&
					a.length &&
					b.length &&
					b.length < a.length &&
					b.every(item => prev.includes(item))
				) {
					for (const usort of b) {
						for (const sort of a) {
							if (usort.index === sort.index - 1) {
								sort.begin.before(...nodesFromRow(usort))
								break
							} else if (usort.index === sort.index + 1) {
								sort.end.after(...nodesFromRow(usort))
								break
							}
						}
					}
				}

				// handles all other cases
				// best for any combination of: push/pop/shift/unshift/insertion/deletion
				// must check in reverse as on creation stuff is added to the end

				let current = rows[rows.length - 1]
				for (let i = rows.length - 1; i > 0; i--) {
					const previous = rows[i - 1]
					if (current.begin.previousSibling !== previous.end) {
						current.begin.before(...nodesFromRow(previous))
					}
					current = previous
				}
			}

			// save sorted list
			prev = rows

			// return external representation
			return rows.map(item => item.nodes)
		})
	}
	mapper[$map] = null
	return mapper
}
