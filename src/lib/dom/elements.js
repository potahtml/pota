import { isArray } from '../std/isArray.js'

const bind = fn => document[fn].bind(document)

export const createElement = bind('createElement')

export const createElementNS = bind('createElementNS')

export const createTextNode = bind('createTextNode')

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
