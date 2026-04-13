import { addEvent, ownedEvent } from '../../lib/reactive.js'
import { flatForEach } from '../../lib/std.js'

/**
 * Attaches event handlers (singular or array) to an element.
 *
 * @template {JSX.DOMElement} TargetElement
 * @template {keyof JSX.EventType} Name
 * @param {TargetElement} node
 * @param {Name} name
 * @param {JSX.EventHandlers<JSX.EventType[Name], TargetElement>} value
 */
export const setEvent = (node, name, value) => {
	flatForEach(value, value => {
		addEvent(
			node,
			name,
			ownedEvent(
				/** @type JSX.EventHandler<Event, Element> */ (value),
			),
		)
	})
}

/**
 * Attaches namespaced event handlers, (singular or array) to an
 * element.
 *
 * @template {JSX.DOMElement} TargetElement
 * @template {keyof JSX.EventType} Name
 * @param {TargetElement} node
 * @param {Name} localName
 * @param {JSX.EventHandlers<JSX.EventType[Name], TargetElement>} value
 */
export const setEventNS = (node, localName, value) => {
	flatForEach(value, value => {
		setEvent(node, localName, value)
	})
}
