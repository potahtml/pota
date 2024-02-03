const bind = fn => document[fn].bind(document)

export let createElement = tagName => {
	const create = bind('createElement')
	createElement = tagName => create(tagName)
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
