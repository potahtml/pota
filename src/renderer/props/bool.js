import { untrack } from '../../lib/reactivity/primitives/solid.js'
import { withValue } from '../../lib/reactivity/withValue.js'
import { onPropChange } from './on-prop-change.js'

// BOOL ATTRIBUTES

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setBoolNS = (node, name, value, props, localName, ns) =>
	setBool(node, localName, value)

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 */
export const setBool = (node, name, value) =>
	withValue(value, value => _setBool(node, name, value))

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 */
function _setBool(node, name, value) {
	untrack(() => {
		// if the value is falsy gets removed
		!value ? node.removeAttribute(name) : node.setAttribute(name, '')

		onPropChange(node, name, value)
	})
}
