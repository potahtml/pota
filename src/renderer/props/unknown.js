// NODE UNKNOWN PROPERTIES / ATTRIBUTES

import { withValue } from '../../lib/reactivity/withValue.js'
import { _setProperty } from './property.js'
import { _setAttribute } from './attribute.js'

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} ns
 */
export const setUnknownProp = (node, name, value, ns) =>
	withValue(value, value => _setUnknownProp(node, name, value, ns))

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} ns
 */
const _setUnknownProp = (node, name, value, ns) =>
	// set as property when boolean
	// if name has a dash is set as a string
	typeof value === 'boolean' && !name.includes('-')
		? _setProperty(node, name, value)
		: _setAttribute(node, name, value, ns)
