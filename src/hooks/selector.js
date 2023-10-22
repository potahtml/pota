import { cleanup, effect, signal } from '#primitives'

/**
 * Returns a function that will return true when the argument for it
 * matches the original signal `value`.
 *
 * @param {pota.Signal} value - Signal with the current value
 * @returns {(item: any) => pota.Signal} Signal that you can run with
 *   a value to know if matches the original signal
 */
export function selector(value) {
	const map = new Map()

	let prev
	effect(() => {
		const selected = value()
		if (selected === prev) return

		const previous = map.get(prev)
		if (previous) previous.write(false)

		const current = map.get(selected)
		if (current) current.write(true)

		prev = selected
	})

	const defaultValue = value()

	/**
	 * Is selected function, it will return true when the value matches
	 * the current signal
	 *
	 * @param {unknown} item - Values to compare with current
	 * @returns {pota.Signal} A signal with a boolean value
	 */
	return function isSelected(item) {
		if (!map.has(item)) {
			// todo: is this cleaning earlier than it should do?
			// when isSelected is used in many places, and 1 gets disposed
			cleanup(() => map.delete(item))

			const [read, write] = signal(item === defaultValue)
			map.set(item, {
				read,
				write,
			})
		}

		return map.get(item).read
	}
}
