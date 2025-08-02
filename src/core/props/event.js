import { addEvent, ownedEvent } from '../../lib/reactive.js'

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

/**
 * @template {Element} T
 * @param {T} node
 * @param {string} localName
 * @param {EventHandler<Event, T>} value
 */
export const setEventNS = (node, localName, value) => {
	setEvent(node, localName, value)
}
