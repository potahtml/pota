// node class / classList

import { withValue } from '../../lib/reactivity/withValue.js'
import { entries, isObject, isString } from '../../lib/std/@main.js'

/**
 * @param {Elements} node
 * @param {string} name
 * @param {object | string | ArrayLike<any>} value
 * @param {object} props
 */
export const setClass = (node, name, value, props) =>
	isString(value)
		? node.setAttribute('class', value)
		: setClassList(node, value)

/**
 * @param {Elements} node
 * @param {string} name
 * @param {object | string | ArrayLike<any>} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setClassNS = (
	node,
	name,
	value,
	props,
	localName,
	ns,
) =>
	isObject(value)
		? setClassList(node, value)
		: setClassListValue(node, localName, value)

// todo: the name of the class is not reactive

/**
 * @param {Elements} node
 * @param {object | string | ArrayLike<any>} value
 */
function setClassList(node, value) {
	switch (typeof value) {
		case 'string': {
			_setClassListValue(node, value, true)
			break
		}

		case 'object': {
			for (const [name, _value] of entries(value))
				setClassListValue(node, name, _value)
			break
		}

		case 'function': {
			withValue(value, value => setClassList(node, value))
			break
		}
	}
}
/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 */
const setClassListValue = (node, name, value) =>
	withValue(value, value => _setClassListValue(node, name, value))

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 */

const _setClassListValue = (node, name, value) =>
	// null, undefined or false, the class is removed
	!value
		? node.classList.remove(name)
		: node.classList.add(...name.trim().split(/\s+/))
