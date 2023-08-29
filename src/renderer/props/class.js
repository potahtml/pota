// node class / classList

import { effect } from '#main'
import { entries, getValue, isFunction, isNotNullObject } from '#std'

export function setClass(node, name, value, props) {
	setNodeClassList(node.classList, value)
}

export function setClassNS(node, name, value, props, localName, ns) {
	setNodeClassList(
		node.classList,
		isNotNullObject(value) ? value : { [localName]: value },
	)
}

// todo: the name of the class is not reactive

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
function setNodeClassListValue(classList, name, value) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeClassListValue(classList, name, getValue(value))
		})
	} else {
		_setNodeClassListValue(classList, name, value)
	}
}
function _setNodeClassListValue(classList, name, value) {
	// null, undefined or false the class is removed
	if (!value) {
		classList.remove(name)
	} else {
		classList.add(...name.trim().split(/\s+/))
	}
}
