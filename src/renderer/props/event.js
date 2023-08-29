// events
// delegated and native events are hold into an array property of the node
// to avoid duplicated events that could be added by using `ns` in ease of organization

import { defineProperty, empty, isArray, removeFromArray } from '#std'
import { $meta } from '../constants.js'

const EventNames = empty()

const Delegated = empty()

export function eventName(s) {
	if (EventNames[s] !== undefined) {
		return EventNames[s]
	}
	EventNames[s] = null

	if (s.startsWith('on') && window[s.toLowerCase()] !== undefined) {
		EventNames[s] = s.substr(2).toLowerCase()
	}
	return EventNames[s]
}

export function setEventNS(node, name, value, props, localName, ns) {
	// delegated: no
	addEvent(node, localName, value, false, false)
}

export function addEvent(
	node,
	type,
	handler,
	delegated,
	external = true,
) {
	node[$meta] = node[$meta] || (node[$meta] = empty())

	const key = delegated ? type : `${type}Native`
	const handlers = node[$meta][key] || (node[$meta][key] = [])

	if (delegated) {
		if (Delegated[type] === undefined) {
			Delegated[type] = null
			document.addEventListener(type, eventHandlerDelegated, {
				passive: true,
			})
		}
	} else {
		if (handlers.length === 0) {
			node.addEventListener(type, eventHandlerNative)
		}
	}

	handler[$meta] = isArray(handler) ? handler : [handler]

	handlers.push(handler)

	if (external)
		return () => removeEvent(node, type, handler, delegated)
}

export function removeEvent(node, type, handler, delegated) {
	const key = delegated ? type : `${type}Native`
	const handlers = node[$meta][key]

	removeFromArray(handlers, handler)
	if (!delegated && handlers.length === 0) {
		node.removeEventListener(type, eventHandlerNative)
	}
	return () => addEvent(node, type, handler, delegated)
}

function eventHandlerNative(e) {
	const key = `${e.type}Native`
	const node = e.target
	const handlers = node[$meta][key]
	eventDispatch(node, e, handlers)
}

function eventHandlerDelegated(e) {
	const key = e.type

	let node = (e.composedPath && e.composedPath()[0]) || e.target

	// reverse Shadow DOM retargetting
	// from dom-expressions
	if (e.target !== node) {
		defineProperty(e, 'target', {
			value: node,
		})
	}

	// simulate currentTarget
	defineProperty(e, 'currentTarget', {
		value: node,
	})

	while (node) {
		const handlers = node[$meta] && node[$meta][key]
		if (handlers && !node.disabled) {
			eventDispatch(node, e, handlers)
			if (e.cancelBubble) break
		}
		node = node.parentNode
	}
}

function eventDispatch(node, e, handlers) {
	for (const handler of handlers) {
		handler[$meta][0].call(node, e, ...handler[$meta].slice(1))
		if (e.cancelBubble) break
	}
}
