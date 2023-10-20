// events
// delegated and native events are hold into an array property of the node
// to avoid duplicated events that could be added by using `ns` in ease of organization

import { cleanup } from '#primitives'
import { defineProperty, empty, isArray, removeFromArray } from '#std'
import { $meta } from '../constants.js'

/**
 * @param {pota.element} node
 * @param {string} name
 * @param {pota.handler} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export function setEventNS(node, name, value, props, localName, ns) {
	// delegated: no
	addEventListener(node, localName, value, false, false)
}

const EventNames = empty()

/**
 * Returns an event name when the string could be mapped to an event
 *
 * @param {string} name - String to check for a mapped event
 * @returns {string | null} Returns the event name or null in case
 *   isnt found
 */
export function eventName(name) {
	if (name in EventNames) {
		return EventNames[name]
	}

	if (
		name.startsWith('on') &&
		window[name.toLowerCase()] !== undefined
	) {
		EventNames[name] = name.substr(2).toLowerCase()
	} else {
		EventNames[name] = null
	}
	return EventNames[name]
}

const Delegated = empty()

/**
 * Adds an event listener to a node
 *
 * @param {pota.element} node - Element to add the event listener
 * @param {string} type - The name of the event listener
 * @param {pota.handler} handler - Function to handle the event
 * @param {boolean} [delegated] - To choose delegation or not
 * @param {boolean} [external] - External defaults to true and avoids
 *   returning an `off` function for the event listener
 * @returns {Function | void} - An `off` function for removing the
 *   event listener
 */
export function addEventListener(
	node,
	type,
	handler,
	delegated = false,
	external = true,
) {
	node[$meta] = node[$meta] || empty()

	const key = delegated ? type : `${type}Native`
	let handlers
	handlers = node[$meta][key] = node[$meta][key] || []

	if (delegated) {
		if (!(type in Delegated) || Delegated[type] === 0) {
			Delegated[type] = 0
			document.addEventListener(type, eventHandlerDelegated, {
				passive: true,
			})
		}
		Delegated[type]++
		// remove event on cleanup if not in use
		cleanup(() => {
			if (--Delegated[type] === 0) {
				document.removeEventListener(type, eventHandlerDelegated)
			}
		})
	} else {
		if (handlers.length === 0) {
			node.addEventListener(type, eventHandlerNative)
		}
	}

	handler[$meta] = isArray(handler) ? handler : [handler]

	handlers.push(handler)

	if (external)
		return () => removeEventListener(node, type, handler, delegated)
}

/**
 * Removes an event listener from a node
 *
 * @param {pota.element} node - Element to add the event listener
 * @param {string} type - The name of the event listener
 * @param {pota.handler} handler - Function to handle the event
 * @param {boolean} [delegated] - To choose delegation or not
 * @returns {Function} - An `on` function for adding back the event
 *   listener
 */
export function removeEventListener(node, type, handler, delegated) {
	const key = delegated ? type : `${type}Native`
	const handlers = node[$meta][key]

	removeFromArray(handlers, handler)
	if (!delegated && handlers.length === 0) {
		node.removeEventListener(type, eventHandlerNative)
	}
	return () => addEventListener(node, type, handler, delegated)
}

/** @param {Event} e - Event */
function eventHandlerNative(e) {
	const key = `${e.type}Native`
	const node = e.currentTarget
	const handlers = node[$meta][key]
	eventDispatch(e.target, handlers, e)
}
/** @param {Event} e - Event */
function eventHandlerDelegated(e) {
	const key = e.type

	let node = (e.composedPath && e.composedPath()[0]) || e.target

	// reverse Shadow DOM retargetting
	// from dom-expressions
	// I dont understand this
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
			eventDispatch(node, handlers, e)
			if (e.cancelBubble) break
		}
		node = node.parentNode
	}
}
/**
 * @param {pota.element} node
 * @param {Function[]} handlers
 * @param {Event} e - Event
 */
function eventDispatch(node, handlers, e) {
	for (const handler of handlers) {
		handler[$meta][0].call(node, ...handler[$meta].slice(1), e)
		if (e.cancelBubble) break
	}
}
