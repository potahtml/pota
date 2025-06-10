import { signal, cleanup, syncEffect } from '../lib/reactive.js'
import { isIterable, toArray } from '../lib/std.js'

/**
 * Returns a `isSelected` function that will return `true` when the
 * argument for it matches the original signal `value`.
 *
 * @param {SignalAccessor<any>} value - Signal with the current value
 */
export function useSelector(value) {
	const map = new Map()

	let prev = []

	syncEffect(() => {
		const val = value()

		const selected = isIterable(val)
			? toArray(val.values())
			: val === undefined
				? []
				: [val]

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
	 * @template T
	 * @param {T} item - Values to compare with current
	 * @returns {SignalAccessor<T>} A signal with a boolean value
	 */
	return function isSelected(item) {
		let selected = map.get(item)
		if (!selected) {
			selected = signal(prev.includes(item))
			selected.counter = 1
			map.set(item, selected)
		} else {
			selected.counter++
		}

		cleanup(() => {
			if (--selected.counter === 0) {
				map.delete(item)
			}
		})

		return selected.read
	}
}
