// events
// delegated and native events are hold into an array property of the node
// to avoid duplicated events that could be added by using `ns` in ease of organization

import { cleanup } from '../../lib/reactivity/primitives/solid.js'
import { empty } from '../../lib/std/empty.js'
import { isFunction } from '../../lib/std/isFunction.js'

/**
 * @param {Elements} node
 * @param {string} name
 * @param {EventListenerOrEventListenerObject} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setEventNS = (node, name, value, props, localName, ns) =>
	// delegated: no
	addEventListener(node, localName, value, false)

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
		EventNames[name] = name.slice(2).toLowerCase()
	} else {
		EventNames[name] = null
	}
	return EventNames[name]
}

/**
 * Adds an event listener to a node
 *
 * @param {Elements} node - Element to add the event listener
 * @param {string} type - The name of the event listener
 * @param {EventListenerOrEventListenerObject} handler - Function to
 *   handle the event
 * @param {boolean} [external] - External defaults to true and avoids
 *   returning an `off` function for the event listener
 * @returns {Function | void} - An `off` function for removing the
 *   event listener
 * @url https://pota.quack.uy/props/EventListener
 */
export function addEventListener(
	node,
	type,
	handler,
	external = true,
) {
	node.addEventListener(
		type,
		handler,
		isFunction(handler) ? null : handler,
	)

	// remove event on cleanup
	cleanup(() => {
		removeEventListener(node, type, handler, false)
	})

	if (external) {
		return () => removeEventListener(node, type, handler)
	}
}

/**
 * Removes an event listener from a node
 *
 * @param {Elements} node - Element to add the event listener
 * @param {string} type - The name of the event listener
 * @param {EventListenerOrEventListenerObject} handler - Function to
 *   handle the event
 * @param {boolean} [external] - External defaults to true and avoids
 *   returning an `off` function for the event listener
 * @returns {Function | void} - An `on` function for adding back the
 *   event listener
 * @url https://pota.quack.uy/props/EventListener
 */
export function removeEventListener(
	node,
	type,
	handler,
	external = true,
) {
	node.removeEventListener(type, handler)

	if (external) {
		return () => addEventListener(node, type, handler)
	}
}
