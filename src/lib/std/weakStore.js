/**
 * Creates a WeakMap to store data
 *
 * @returns {{
 * 	store: WeakMap<WeakKey, any>
 * 	get: (
 * 		reference: WeakKey,
 * 		createIfNotExistsAs?: (target: any) => any,
 * 	) => any
 * 	set: (key: WeakKey, value: any) => void
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
		get: (target, defaults = undefined) => {
			const o = get(target)
			if (o !== undefined) return o
			if (defaults !== undefined) {
				/**
				 * Default values should be passed as a function, so we dont
				 * constantly initialize values when giving them
				 */
				defaults = defaults(target)
				set(target, defaults)
				return defaults
			}
		},
		set,
		has,
	}
}
