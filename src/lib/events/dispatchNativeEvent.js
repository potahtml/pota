/**
 * @param {Elements} node
 * @param {string} eventName
 * @param {any} [data]
 */
export const dispatchNativeEvent = (
	node,
	eventName,
	data = { bubbles: true },
) => node.dispatchEvent(new Event(eventName, data))
