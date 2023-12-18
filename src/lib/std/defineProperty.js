const define = Object.defineProperty

const defaults = {
	enumerable: true,
	configurable: true,
}

/**
 * Object.defineProperty
 *
 * @param {object} target
 * @param {PropertyKey} key
 * @param {PropertyDescriptor} descriptor
 */
export const defineProperty = (target, key, descriptor) =>
	define(target, key, {
		...defaults,
		...descriptor,
	})
