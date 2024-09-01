// node class / classList

import { withPrevValue, withValue } from '../lib/reactive.js'
import {
	classListAdd,
	classListRemove,
	isFunction,
	isObject,
	isString,
} from '../lib/std.js'

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
	isFunction(value)
		? setClassListValue(node, localName, value)
		: setClassList(node, value)

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
			let name
			for (name in value) {
				setClassListValue(node, name, value[name])
			}
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
	withPrevValue(value, (value, prev) => {
		// on initialization do not remove whats not there
		if (!value && !prev) {
		} else {
			_setClassListValue(node, name, value)
		}
	})

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 */

const _setClassListValue = (node, name, value) =>
	// null, undefined or false, the class is removed
	!value
		? classListRemove(node, name)
		: classListAdd(node, ...name.trim().split(/\s+/))
