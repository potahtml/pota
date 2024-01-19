import { dispatchNativeEvent } from '../../lib/events/dispatchNativeEvent.js'
import { untrack } from '../../lib/reactivity/primitives/solid.js'
import { withValue } from '../../lib/reactivity/withValue.js'
import { isNullUndefined } from '../../lib/std/isNullUndefined.js'
import { onPropChange } from './on-prop-change.js'

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setPropertyNS = (
	node,
	name,
	value,
	props,
	localName,
	ns,
) => setProperty(node, localName, value)

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 */
export const setProperty = (node, name, value) =>
	withValue(value, value => _setProperty(node, name, value))

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 */
export function _setProperty(node, name, value) {
	untrack(() => {
		// if the value is null or undefined it will be removed
		if (isNullUndefined(value)) {
			delete node[name]
		} else {
			node[name] = value
		}
		if (name === 'value') {
			dispatchNativeEvent(node, 'input')
			dispatchNativeEvent(node, 'change')
		}
		onPropChange(node, name, value)
	})
}
