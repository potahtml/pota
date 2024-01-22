/**
 * Creates a WeakMap to store data
 *
 * @returns {{
 * 	store: WeakMap<WeakKey, any>
 * 	get: (reference, createIfNotExistsAs = undefined) => any
 * 	set: Function
 * 	has: Function
 * }}
 */

export function weakStore() {
	const store = new WeakMap()
	const set = store.set.bind(store)
	const get = store.get.bind(store)
	const has = store.has.bind(store)
	return {
		store,
		get: (obj, defaults = undefined) => {
			const o = get(obj)
			if (o) return o
			if (defaults !== undefined) {
				set(obj, defaults)
				return defaults
			}
		},
		set,
		has,
	}
}
