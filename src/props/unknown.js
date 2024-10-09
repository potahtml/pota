// NODE UNKNOWN PROPERTIES / ATTRIBUTES

import { setAttribute } from './attribute.js'
import { setProperty } from './property.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} [ns]
 */
export const setUnknown = (node, name, value, ns) => {
	name in node && !(node instanceof SVGElement)
		? setProperty(node, name, value)
		: setAttribute(node, name, value, ns)
}
