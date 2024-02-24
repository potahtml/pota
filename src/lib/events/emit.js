/**
 * @param {Elements} node
 * @param {string} eventName
 * @param {any} [data]
 */

export const emit = (
	node,
	eventName,
	data = { bubbles: true, cancelable: true, composed: true },
) => node.dispatchEvent(new CustomEvent(eventName, data))
