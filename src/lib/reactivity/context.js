import { empty } from '#std'

import { children } from '#main'

export function context(defaultValue = empty()) {
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
	Context.Provider = function (props) {
		return () =>
			Context(props.value, () => children(() => props.children)())
	}
	return Context
}
