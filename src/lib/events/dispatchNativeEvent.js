export const dispatchNativeEvent = (
	node,
	event,
	data = { bubbles: true },
) => node.dispatchEvent(new Event(event, data))
