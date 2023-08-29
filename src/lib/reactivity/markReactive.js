import { $reactive } from '#reactivity'

export function markReactive(fn) {
	fn[$reactive] = null
	return fn
}
