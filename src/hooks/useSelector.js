import {
	effect,
	signal,
	cleanup,
} from '../lib/reactivity/primitives/solid.js'

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

	let prev
	effect(() => {
		const selected = value()
		if (selected === prev) return

		const previous = map.get(prev)
		if (previous) previous[1](false)

		const current = map.get(selected)
		if (current) current[1](true)

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
			selected = signal(item === value())
			selected[2] = 0
			map.set(item, selected)
		}

		selected[2]++

		cleanup(() => {
			if (--selected[2] === 0) {
				map.delete(item)
			}
		})

		return selected[0]
	}
}
