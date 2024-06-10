import {
	signal,
	cleanup,
	syncEffect,
} from '../lib/reactivity/reactive.js'
import { isIterable } from '../lib/std/isIterable.js'
import { toArray } from '../lib/std/toArray.js'

/**
 * Returns a `isSelected` function that will return `true` when the
 * argument for it matches the original signal `value`.
 *
 * @param {Signal} value - Signal with the current value
 * @returns {(item: any) => Signal} Signal that you can run with a
 *   value to know if matches the original signal
 */
export function useSelector(value) {
	const map = new Map()

	let prev = []

	syncEffect(() => {
		const val = value()

		const selected = isIterable(val) ? toArray(val.values()) : [val]

		// unselect
		for (const value of prev) {
			if (!selected.includes(value)) {
				const current = map.get(value)
				current && current.write(false)
			}
		}

		// select
		for (const value of selected) {
			if (!prev.includes(value)) {
				const current = map.get(value)
				current && current.write(true)
			}
		}

		prev = selected
	})

	/**
	 * Is selected function, it will return `true` when the value
	 * matches the current signal.
	 *
	 * @param {any} item - Values to compare with current
	 * @returns {Signal} A signal with a boolean value
	 */
	return function isSelected(item) {
		let selected = map.get(item)
		if (!selected) {
			selected = signal(prev.includes(item))
			selected.counter = 0
			map.set(item, selected)
		}

		selected.counter++

		cleanup(() => {
			if (--selected.counter === 0) {
				map.delete(item)
			}
		})

		return selected.read
	}
}
