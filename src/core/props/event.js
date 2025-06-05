import { addEvent, ownedEvent } from '../../lib/reactive.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {EventListener
 * 	| EventListenerObject
 * 	| (EventListenerObject & AddEventListenerOptions)} value
 * @param {object} props
 * @param {string} localName
 * @param {string} ns
 */
export const setEventNS = (node, name, value, props, localName, ns) =>
	// `value &&` because avoids crash when `on:click={prop.onClick}` and `prop.onClick === null`
	value && addEvent(node, localName, ownedEvent(value))
