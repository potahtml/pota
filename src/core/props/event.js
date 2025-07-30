import { addEvent, ownedEvent } from '../../lib/reactive.js'

/**
 * @template {Element} T
 * @param {T} node
 * @param {string} name
 * @param {EventHandler<Event, T>} value
 * @param {string} localName
 * @param {string} ns
 */
export const setEventNS = (node, name, value, localName, ns) => {
	// `value &&` because avoids crash when `on:click={prop.onClick}` and `!prop.onClick`
	setEvent(node, localName, value)
}

/**
 * @template {Element} T
 * @param {T} node
 * @param {string} name
 * @param {EventHandler<Event, T>} value
 */
export const setEvent = (node, name, value) => {
	// `value &&` because avoids crash when `on:click={prop.onClick}` and `!prop.onClick`
	value && addEvent(node, name, ownedEvent(value)) // ownedEvent
}
