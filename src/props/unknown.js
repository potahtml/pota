// NODE UNKNOWN PROPERTIES / ATTRIBUTES

import { withValue } from '../lib/reactive.js'
import { isBoolean, isNullUndefined, isObject } from '../lib/std.js'

import { _setAttribute } from './attribute.js'
import { _setProperty } from './property.js'

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} [ns]
 */
export const setUnknownProp = (node, name, value, ns) =>
	withValue(value, value => _setUnknownProp(node, name, value, ns))

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} [ns]
 */
const _setUnknownProp = (node, name, value, ns) => {
	if (isObject(value)) {
		// when not null object
		_setProperty(node, name, value)
	} else if (isBoolean(value) && !name.includes('-')) {
		// when boolean and name doesnt have a hyphen
		_setProperty(node, name, value)
	} else {
		// fallback to attribute
		_setAttribute(node, name, value, ns)

		// to be able to delete properties
		isNullUndefined(value) && _setProperty(node, name, value)
	}
}
