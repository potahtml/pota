// MAP

import { $map } from '../constants.js'
import {
	cleanup,
	root,
	untrack,
} from '../lib/reactivity/primitives/solid.js'
import { getValue, removeFromArray } from '../lib/std/@main.js'

/** Reactive Map */
export class ReactiveMap {
	[$map] = null
	/**
	 * @param {Each} items
	 * @param {Function} callback
	 */
	constructor(items, callback) {
		this.mapper = map(items, callback, true)
	}
	/** @param {Function} fn */
	map(fn) {
		return this.mapper(fn)
	}
}

/**
 * Reactive Map
 *
 * @param {Each} list
 * @param {Function} callback
 * @param {boolean} [sort] - To reorder items in the document
 */
export function map(list, callback, sort) {
	const cache = new Map()
	const duplicates = new Map() // for when caching by value is not possible [1, 2, 1]

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
			const nodes = untrack(() =>
				fn ? fn(callback(item, index), index) : callback(item, index),
			)

			const row = {
				runId: -1,
				// this is held here only to be returned on the first run, but no need to keep it after
				nodes: runId === 1 ? nodes : null,
				// reference nodes, it holds the placeholders that delimit `begin` and `end`
				// you can quickly check if items are in the right order
				// by checking if item.end === nextItem.begin.previousSibling
				begin: !sort ? null : nodes[0],
				end: !sort ? null : nodes.at(-1),
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
	return function (fn) {
		const items = getValue(list) || []

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
			// best for any combination of: push/pop/shift/unshift/insertion/deletion
			// as for swap, anything in between the swapped elements gets sorted,
			// so as long as the swapped elements are close to each other is good
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
		// after the first run it lives in an effect
		if (runId === 1) {
			try {
				return rows.map(item => {
					return item.nodes
				})
			} finally {
				// remove cached nodes as these are not needed after the first run
				for (const node of rows) node.nodes = null
			}
		}
		return null
	}
}
