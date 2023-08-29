// node style

import { effect } from '#main'

import {
	entries,
	getValue,
	hasValue,
	isFunction,
	isNotNullObject,
} from '#std'

export function setStyle(node, name, value, props) {
	setNodeStyle(node.style, value)
}

export function setStyleNS(node, name, value, props, localName, ns) {
	setNodeStyle(
		node.style,
		isNotNullObject(value) ? value : { [localName]: value },
	)
}
export function setVarNS(node, name, value, props, localName, ns) {
	setNodeStyle(node.style, { ['--' + localName]: value })
}

function setNodeStyle(style, value) {
	if (isNotNullObject(value)) {
		for (const [name, _value] of entries(value))
			setNodeStyleValue(style, name, _value)
		return
	}
	const type = typeof value
	if (type === 'string') {
		style.cssText = value
		return
	}
	if (type === 'function') {
		effect(() => {
			setNodeStyle(style, getValue(value))
		})
		return
	}
}
function setNodeStyleValue(style, name, value) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeStyleValue(style, name, getValue(value))
		})
	} else {
		_setNodeStyleValue(style, name, value)
	}
}
function _setNodeStyleValue(style, name, value) {
	// if the value is null or undefined it will be removed
	if (!hasValue(value)) {
		style.removeProperty(name)
	} else {
		style.setProperty(name, value)
	}
}
