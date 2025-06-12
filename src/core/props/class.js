// node class / classList

import { isFunction, isObject, isString } from '../../lib/std.js'
import { withPrevValue, withValue } from '../../lib/reactive.js'

import { addClass, removeClass } from '../../use/dom.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {object | string | ArrayLike<any>} value
 * @param {object} props
 */
export const setClass = (node, name, value, props) => {
	isString(value)
		? node.setAttribute(name, value)
		: setClassList(node, value)
}

/**
 * @param {Element} node
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
) => {
	isFunction(value) || !isObject(value)
		? setElementClass(node, localName, value)
		: setClassList(node, value)
}

/**
 * @param {Element} node
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
				setElementClass(node, name, value[name])
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
		? removeClass(node, name)
		: addClass(node, ...name.trim().split(/\s+/))
}
