const Meta = new WeakMap()

const get = Meta.get.bind(Meta)
const set = Meta.set.bind(Meta)

/**
 * Gets or sets a property for an object stored on a WeakMap
 *
 * @param {object} object
 * @param {PropertyKey} key
 * @param {any} [defaults] - When defaults is given it will create it
 *   if doesnt exits
 * @returns {any}
 */
export function property(object, key, defaults) {
	const meta = get(object)

	// meta doesnt exists
	if (!meta) {
		// defaults to something so should be created
		if (defaults !== undefined) {
			set(object, { [key]: defaults })
			return defaults
		}
		// doesnt default to anything so just return
		return
	}

	// the property exists in the object
	if (key in meta) {
		return meta[key]
	}

	// the property doesnt exists in the object
	// create it if a default was provided
	if (defaults !== undefined) {
		meta[key] = defaults
		return defaults
	}
}
