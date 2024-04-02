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
	addEventListener(node, localName, value)

const EventNames = empty()

/**
 * Returns an event name when the string could be mapped to an event
 *
 * @param {string} name - String to check for a mapped event
 * @returns {string | undefined} Returns the event name or null in
 *   case isnt found
 */
export function eventName(name) {
	if (name in EventNames) {
		return EventNames[name]
	}

	if (name.startsWith('on') && name.toLowerCase() in window) {
		EventNames[name] = name.slice(2).toLowerCase()
	} else {
		EventNames[name] = undefined
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
 * @returns {Function} - An `off` function for removing the event
 *   listener
 * @url https://pota.quack.uy/props/EventListener
 */
export function addEventListener(node, type, handler) {
	node.addEventListener(
		type,
		handler,
		isFunction(handler) ? undefined : handler,
	)

	const off = () => removeEventListener(node, type, handler)

	// remove event on cleanup?
	// cleanup(off)

	return off
}

/**
 * Removes an event listener from a node
 *
 * @param {Elements} node - Element to add the event listener
 * @param {string} type - The name of the event listener
 * @param {EventListenerOrEventListenerObject} handler - Function to
 *   handle the event
 * @returns {Function} - An `on` function for adding back the event
 *   listener
 * @url https://pota.quack.uy/props/EventListener
 */
export function removeEventListener(node, type, handler) {
	node.removeEventListener(type, handler)

	return () => addEventListener(node, type, handler)
}
