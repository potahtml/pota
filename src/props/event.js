import { addEventListener } from '../lib/reactive.js'
import { window, withCache } from '../lib/std.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {EventListenerOrEventListenerObject} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setEventNS = (node, name, value, props, localName, ns) =>
	addEventListener(node, localName, value)

/**
 * Returns an event name when the string could be mapped to an event
 *
 * @param {string} name - String to check for a mapped event
 * @returns {string | undefined} Returns the event name or null in
 *   case isnt found
 */
export const eventName = withCache(name =>
	name.startsWith('on') && name.toLowerCase() in window
		? name.slice(2).toLowerCase()
		: null,
)
/*
const eventNames = new Set(
	keys(global).filter(prop => prop.startsWith('on')),
)
*/
