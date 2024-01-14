// node class / classList

import { effect } from '../../lib/reactivity/primitives/solid.js'
import {
	entries,
	getValue,
	isFunction,
	isNotNullObject,
} from '../../lib/std/@main.js'

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 */
export const setClass = (node, name, value, props) =>
	setNodeClassList(node.classList, value)

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setClassNS = (node, name, value, props, localName, ns) =>
	setNodeClassList(
		node.classList,
		isNotNullObject(value) ? value : { [localName]: value },
	)

// todo: the name of the class is not reactive

/**
 * @param {DOMTokenList} classList
 * @param {unknown | string | ArrayLike<any>} value
 */
function setNodeClassList(classList, value) {
	if (isNotNullObject(value)) {
		for (const [name, _value] of entries(value))
			setNodeClassListValue(classList, name, _value)
		return
	}
	const type = typeof value

	if (type === 'string') {
		setNodeClassListValue(classList, value, true)
		return
	}
	if (type === 'function') {
		effect(() => {
			setNodeClassList(classList, getValue(value))
		})
		return
	}
}
/**
 * @param {DOMTokenList} classList
 * @param {string} name
 * @param {unknown} value
 */
const setNodeClassListValue = (classList, name, value) =>
	isFunction(value)
		? effect(() => {
				_setNodeClassListValue(classList, name, getValue(value))
			})
		: _setNodeClassListValue(classList, name, value)

/**
 * @param {DOMTokenList} classList
 * @param {string} name
 * @param {unknown} value
 */
const _setNodeClassListValue = (classList, name, value) =>
	// null, undefined or false the class is removed
	!value
		? classList.remove(name)
		: classList.add(...name.trim().split(/\s+/))
