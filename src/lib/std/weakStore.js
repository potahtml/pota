/**
 * Creates a WeakMap to store data
 *
 * @returns {[
 * 	(
 * 		reference: WeakKey,
 * 		createIfNotExistsAs?: (target: any) => any,
 * 	) => any,
 * 	(key: WeakKey, value: any) => void,
 * 	Function,
 * 	Function,
 * 	WeakMap<WeakKey, any>,
 * ]}
 */

export function weakStore() {
	const store = new WeakMap()
	const get = store.get.bind(store)
	const set = store.set.bind(store)
	return [
		(target, defaults = undefined) => {
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
		store.has.bind(store),
		store.delete.bind(store),
		store,
	]
}
