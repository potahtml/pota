// node class / classList

import {
	isFunction,
	isNullUndefined,
	isObject,
	isString,
} from '../../lib/std.js'
import { withPrevValue } from '../../lib/reactive.js'

import { addClass, classNames, removeClass } from '../../use/dom.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {object | string | ArrayLike<any>} value
 */
export const setClass = (node, name, value) => {
	isString(value)
		? node.setAttribute(name, value)
		: setClassList(node, value)
}

/**
 * @param {Element} node
 * @param {string} name
 * @param {object | string | ArrayLike<any>} value
 * @param {string} localName
 * @param {string} [ns]
 */
export const setClassNS = (node, name, value, localName, ns) => {
	isFunction(value) || !isObject(value)
		? setElementClass(node, localName, value)
		: setClassList(node, value)
}

/**
 * @param {Element} node
 * @param {object | string | ArrayLike<any>} value
 */
export function setClassList(node, value, prev) {
	if (isString(value) || isNullUndefined(value)) {
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
	!value
		? removeClass(node, classNames(name))
		: addClass(node, classNames(name))
}
