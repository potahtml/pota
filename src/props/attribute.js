import { withValue } from '../lib/reactive.js'
import { isNullUndefined } from '../lib/std.js'

import { NS } from '../constants.js'

// NODE ATTRIBUTES

/**
 * @param {Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setAttributeNS = (
	node,
	name,
	value,
	props,
	localName,
	ns,
) => setAttribute(node, localName, value)

/**
 * @param {Element} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} [ns]
 * @url https://pota.quack.uy/props/setAttribute
 */
export const setAttribute = (node, name, value, ns) =>
	withValue(value, value => _setAttribute(node, name, value, ns))

/**
 * @param {Element} node
 * @param {string} name
 * @param {string} value
 * @param {string} [ns]
 */
function _setAttribute(node, name, value, ns) {
	// if the value is null or undefined it will be removed
	if (isNullUndefined(value)) {
		ns && NS[ns]
			? node.removeAttributeNS(NS[ns], name)
			: node.removeAttribute(name)
	} else {
		ns && NS[ns]
			? node.setAttributeNS(NS[ns], name, value)
			: node.setAttribute(name, value)
	}
}
