// node class / classList

import { effect } from '../../lib/reactivity/primitives/solid.js'
import { withValue } from '../../lib/reactivity/withValue.js'
import {
	entries,
	getValue,
	isNotNullObject,
} from '../../lib/std/@main.js'

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 */
export const setClass = (node, name, value, props) =>
	setClassList(node.classList, value)

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setClassNS = (node, name, value, props, localName, ns) =>
	setClassList(
		node.classList,
		isNotNullObject(value) ? value : { [localName]: value },
	)

// todo: the name of the class is not reactive

/**
 * @param {DOMTokenList} classList
 * @param {unknown | string | ArrayLike<any>} value
 */
function setClassList(classList, value) {
	if (isNotNullObject(value)) {
		for (const [name, _value] of entries(value))
			setClassListValue(classList, name, _value)
		return
	}
	const type = typeof value

	if (type === 'string') {
		setClassListValue(classList, value, true)
		return
	}
	if (type === 'function') {
		effect(() => {
			setClassList(classList, getValue(value))
		})
		return
	}
}
/**
 * @param {DOMTokenList} classList
 * @param {string} name
 * @param {unknown} value
 */
const setClassListValue = (classList, name, value) =>
	withValue(value, value =>
		_setClassListValue(classList, name, value),
	)

/**
 * @param {DOMTokenList} classList
 * @param {string} name
 * @param {unknown} value
 */
const _setClassListValue = (classList, name, value) =>
	// null, undefined or false the class is removed
	!value
		? classList.remove(name)
		: classList.add(...name.trim().split(/\s+/))
