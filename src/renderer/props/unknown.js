// NODE UNKNOWN PROPERTIES / ATTRIBUTES

import { withValue } from '../../lib/reactivity/withValue.js'
import { _setProperty } from './property.js'
import { _setAttribute } from './attribute.js'
import { isNotNullObject } from '../../lib/std/isNotNullObject.js'
import { isNullUndefined } from '../../lib/std/isNullUndefined.js'

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
	if (isNotNullObject(value)) {
		// when not null object
		_setProperty(node, name, value)
	} else if (typeof value === 'boolean' && !name.includes('-')) {
		// when boolean and name doesnt have a hyphen
		_setProperty(node, name, value)
	} else {
		// fallback to attribute
		_setAttribute(node, name, value, ns)
		// to be able to delete properties
		isNullUndefined(value) && _setProperty(node, name, value)
	}
}
