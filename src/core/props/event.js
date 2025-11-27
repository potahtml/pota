import { addEvent, ownedEvent } from '../../lib/reactive.js'
import { flatForEach } from '../../lib/std.js'

/**
 * Attaches event handlers (singular or array) to an element.
 *
 * @template {DOMElement} T
 * @param {T} node
 * @param {string} name
 * @param {EventHandlers<Event, T>} value
 */
export const setEvent = (node, name, value) => {
	flatForEach(value, value => {
		addEvent(
			node,
			name,
			ownedEvent(/** @type EventHandler<Event, Element> */ (value)),
		)
	})
}

/**
 * Attaches namespaced event handlers, (singular or array) to an
 * element.
 *
 * @template {DOMElement} T
 * @param {T} node
 * @param {string} localName
 * @param {EventHandlers<Event, T>} value
 */
export const setEventNS = (node, localName, value) => {
	flatForEach(value, value => {
		setEvent(node, localName, value)
	})
}
