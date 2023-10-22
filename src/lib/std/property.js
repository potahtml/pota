import { empty } from './empty.js'

const Meta = new WeakMap()

/**
 * Gets metadata from an object and creates it if needed
 *
 * @param {object} object
 * @param {boolean} [create]
 */
function get(object, create = true) {
	let meta = Meta.get(object)
	if (meta === undefined && create) {
		meta = empty()
		Meta.set(object, meta)
	}
	return meta
}
/**
 * Gets or sets a property for an object on a separated WeakMap
 *
 * @param {object} object
 * @param {PropertyKey} property
 * @param {any} [defaults]
 */
export function property(object, property, defaults) {
	const create = defaults !== undefined
	const meta = get(object, create)
	if (create && meta[property] === undefined) {
		meta[property] = defaults
	}
	return meta && meta[property]
}
