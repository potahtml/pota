import { empty } from '#std'

export function contextSimple(defaultValue = empty()) {
	let value = defaultValue

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
