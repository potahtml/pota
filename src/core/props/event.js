import { addEvent, ownedEvent } from '../../lib/reactive.js'
import { flatForEach } from '../../lib/std.js'

/**
 * @template {Element} T
 * @param {T} node
 * @param {string} name
 * @param {EventHandler<Event, T>} value
 */
export const setEvent = (node, name, value) => {
	flatForEach(value, value => {
		addEvent(node, name, ownedEvent(value))
	})
}

/**
 * @template {Element} T
 * @param {T} node
 * @param {string} localName
 * @param {EventHandler<Event, T>} value
 */
export const setEventNS = (node, localName, value) => {
	flatForEach(value, value => {
		setEvent(node, localName, value)
	})
}
