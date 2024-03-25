import { hasOwnProperty } from './hasOwnProperty.js'

/**
 * Returns `true` if the property is defined in the prototype and
 * absent in the object
 *
 * @param {{}} target
 * @param {PropertyKey} key
 */
export const isPrototypeProperty = (target, key) =>
	// must do `key in target` to check that it DOES have it somewhere
	// must do !hasOwnProperty to check that isnt an own property
	key in target && !hasOwnProperty(target, key)
