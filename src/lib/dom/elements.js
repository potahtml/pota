const bind = fn => document[fn].bind(document)

export let createElement = tagName => {
	createElement = bind('createElement')
	return createElement(tagName)
}

export let createElementNS = (ns, tagName) => {
	createElementNS = bind('createElementNS')
	return createElementNS(ns, tagName)
}

export let createTextNode = tagName => {
	createTextNode = bind('createTextNode')
	return createTextNode(tagName)
}
