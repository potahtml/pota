/**
 * @param {Elements} node
 * @param {string} eventName
 * @param {any} [data]
 */

export const dispatchEvent = (
	node,
	eventName,
	data = { bubbles: true, cancelable: false, composed: true },
) => node.dispatchEvent(new CustomEvent(eventName, data))
