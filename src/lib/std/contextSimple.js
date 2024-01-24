/**
 * Creates a context and returns a function to get or set the value
 *
 * @param {any} [defaultValue] - Default value for the context
 * @returns {typeof Context} Context
 */
export function contextSimple(defaultValue = undefined) {
	let value = defaultValue

	/**
	 * @overload Gets the context value
	 * @returns {any} Context value
	 */
	/**
	 * @overload Runs `fn` with a new value as context
	 * @param {any} newValue - New value for the context
	 * @param {Function} fn - Callback to run with the new context value
	 * @returns {any}
	 */
	/**
	 * @param {any | undefined} newValue
	 * @param {Function | undefined} fn
	 */
	function Context(newValue, fn) {
		if (newValue === undefined) {
			return value
		} else {
			const parent = Context()
			value = newValue
			const result = fn()
			value = parent
			return result
		}
	}

	return Context
}
