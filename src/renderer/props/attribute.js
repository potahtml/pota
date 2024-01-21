import { NS } from '../../constants.js'
import { untrack } from '../../lib/reactivity/primitives/solid.js'
import { withValue } from '../../lib/reactivity/withValue.js'
import { isNullUndefined } from '../../lib/std/isNullUndefined.js'

// NODE ATTRIBUTES

/**
 * @param {Elements} node
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
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} [ns]
 */
export const setAttribute = (node, name, value, ns) =>
	withValue(value, value => _setAttribute(node, name, value, ns))

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} [ns]
 */
export function _setAttribute(node, name, value, ns) {
	untrack(() => {
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
	})
}
