// properties vs attributes

import { effect } from '../../lib/reactivity/primitives/solid.js'
import {
	getValue,
	isFunction,
	isNullUndefined,
} from '../../lib/std/@main.js'

import { $webElement, NS } from '../../constants.js'
import { dispatchNativeEvent } from '../../lib/events/dispatchNativeEvent.js'

// PROP

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 */
export const setProp = (node, name, value, props) =>
	setNodeProperty(node, name, value)

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setPropNS = (node, name, value, props, localName, ns) =>
	setNodeProperty(node, localName, value)

// ATTRIBUTE

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
) => setNodeAttribute(node, localName, value)

// NODE PROPERTIES / ATTRIBUTES

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} ns
 */
export const setNodeProp = (node, name, value, ns) =>
	isFunction(value)
		? effect(() => {
				_setNodeProp(node, name, getValue(value), ns)
			})
		: _setNodeProp(node, name, value, ns)

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} ns
 */
const _setNodeProp = (node, name, value, ns) =>
	// set as property when boolean
	// data-* and attributes with dashes are set as strings
	typeof value === 'boolean' && !name.includes('-')
		? _setNodeProperty(node, name, value)
		: // fallback to attribute when unknown
			_setNodeAttribute(node, name, value, ns)

// NODE PROPERTIES

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 */
export const setNodeProperty = (node, name, value) =>
	isFunction(value)
		? effect(() => {
				_setNodeProperty(node, name, getValue(value))
			})
		: _setNodeProperty(node, name, value)

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 */
function _setNodeProperty(node, name, value) {
	// if the value is null or undefined it will be removed
	if (isNullUndefined(value)) {
		delete node[name]
	} else {
		node[name] = value
	}
	if (name === 'value') {
		dispatchNativeEvent(node, 'input'),
			dispatchNativeEvent(node, 'change')
	}
	if ($webElement in node) node.onPropChange(name, value)
}

// NODE ATTRIBUTES

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} [ns]
 */
export const setNodeAttribute = (node, name, value, ns) =>
	isFunction(value)
		? effect(() => {
				_setNodeAttribute(node, name, getValue(value), ns)
			})
		: _setNodeAttribute(node, name, value, ns)

/**
 * @param {Elements} node
 * @param {string} name
 * @param {unknown} value
 * @param {string} [ns]
 */
function _setNodeAttribute(node, name, value, ns) {
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
	if ($webElement in node) node.onPropChange(name, value)
}
