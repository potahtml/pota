// node class / classList

import { isFunction, isObject, isString } from '../../lib/std.js'
import { withPrevValue } from '../../lib/reactive.js'

import { addClass, removeClass } from '../../use/dom.js'

/**
 * @param {Element} node
 * @param {object | string | ArrayLike<any>} value
 */
export const setClass = (node, value) => {
	isString(value)
		? node.setAttribute('class', value)
		: setClassList(node, value)
}

/**
 * @param {Element} node
 * @param {object | string | ArrayLike<any>} value
 * @param {string} localName
 */
export const setClassNS = (node, localName, value) => {
	isFunction(value) || !isObject(value)
		? setElementClass(node, localName, value)
		: setClassList(node, value)
}

/**
 * @param {Element} node
 * @param {object | string | ArrayLike<any>} value
 * @param {object | string | ArrayLike<any>} [prev]
 */
export function setClassList(node, value, prev) {
	if (isString(value) || value == null) {
		prev && _setClassListValue(node, prev, false)
		value && _setClassListValue(node, value, true)
	} else if (isObject(value)) {
		for (let name in value) {
			setElementClass(node, name, value[name])
		}
	} else if (isFunction(value)) {
		withPrevValue(value, (value, prev) => {
			setClassList(node, value, prev)
		})
	}
}
/**
 * @param {Element} node
 * @param {string} name
 * @param {unknown} value
 */
export const setElementClass = (node, name, value) => {
	withPrevValue(value, (value, prev) => {
		if (!value && !prev) {
			// on initialization do not remove whats not there
		} else {
			_setClassListValue(node, name, value)
		}
	})
}

/**
 * @param {Element} node
 * @param {string} name
 * @param {unknown} value
 */
const _setClassListValue = (node, name, value) => {
	// null, undefined or false, the class is removed
	!value ? removeClass(node, name) : addClass(node, name)
}
