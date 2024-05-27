import { isArray } from '../std/isArray.js'

const bind = fn => document[fn].bind(document)

export const createElement = bind('createElement')

export const createElementNS = bind('createElementNS')

export const createTextNode = bind('createTextNode')

export const importNode = bind('importNode')

export const createTreeWalker = bind('createTreeWalker')

export const adoptedStyleSheets = document.adoptedStyleSheets

export function toDiff(prev = [], node = []) {
	node = isArray(node) ? node.flat(Infinity) : [node]
	for (let i = 0, item; i < prev.length; i++) {
		item = prev[i]
		item &&
			(node.length === 0 || !node.includes(item)) &&
			item.remove()
	}
	return node
}

/** @returns {TreeWalker} */
let _walker
export function walker() {
	if (!_walker) {
		_walker = createTreeWalker(document, NodeFilter.SHOW_ELEMENT)
	}

	return _walker
}

export function walkElements(node, fn) {
	const walk = walker()
	walk.currentNode = node

	/**
	 * The first node is not walked by the walker. Also the first node
	 * could be a DocumentFragment
	 */
	if (node.nodeType === 1) {
		fn(node)
	}

	let r
	while ((node = walk.nextNode())) {
		r = fn(node)
		if (!r && r !== undefined) {
			break
		}
	}
}
