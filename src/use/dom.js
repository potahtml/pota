import {
	emptyArray,
	getValueWithArguments,
	isArray,
	window,
} from '../lib/std.js'

export const document = window.document

export const head = document?.head

export const isConnected = node => node.isConnected

export const activeElement = () => document.activeElement

export const documentElement = document?.documentElement

export const DocumentFragment = window.DocumentFragment

const bind = fn => document && document[fn].bind(document)

export const createElement = bind('createElement')
export const createElementNS = bind('createElementNS')
export const createTextNode = bind('createTextNode')
export const createComment = bind('createComment')

export const importNode = bind('importNode')

export const createTreeWalker = bind('createTreeWalker')

// part

export const addPart = (node, partName) => node.part.add(partName)

export const removePart = (node, partName) =>
	node.part.remove(partName)

// tokenList

export const tokenList = s => (s ? s.trim().split(/\s+/) : emptyArray)

export const addClass = (node, className) =>
	className.length &&
	node.classList.add(
		...(isArray(className) ? className : tokenList(className)),
	)

export const removeClass = (node, className) =>
	className.length &&
	node.classList.remove(
		...(isArray(className) ? className : tokenList(className)),
	)

// attributes

export const setAttribute = (node, name, value) =>
	node.setAttribute(name, value)

export const hasAttribute = (node, name) => node.hasAttribute(name)

export const removeAttribute = (node, name) =>
	node.removeAttribute(name)

// selector

export const querySelector = (node, query) =>
	node.querySelector(query)

export const querySelectorAll = (node, query) =>
	node.querySelectorAll(query)

/**
 * Returns `document` for element. That could be a `shadowRoot`
 *
 * @template {Element | DocumentFragment} T
 * @param {T} node
 * @returns {Document | ShadowRoot}
 */
export const getDocumentForElement = node => {
	const document = /** @type {Document | ShadowRoot} */ (
		node.getRootNode()
	)
	const { nodeType } = document
	// getRootNode returns:
	// 1. Node for isConnected = false
	// 2. Document for isConnected = true
	// 3. ShadowRoot for custom elements

	// always return a Document-like
	return nodeType === 11 /* DOCUMENT_FRAGMENT_NODE (11) */ ||
		nodeType === 9 /* DOCUMENT_NODE (9)*/
		? document
		: node.ownerDocument
}

export const walkElements = function (
	walk,
	node,
	max = Infinity,
	nodes = [],
) {
	/**
	 * The first node is not walked by the walker.
	 *
	 * Also the first node could be a DocumentFragment
	 */
	node.nodeType === 1 && nodes.push(node)

	walk.currentNode = node

	while (nodes.length !== max && (node = walk.nextNode())) {
		nodes.push(node)
	}
	return nodes
}.bind(
	null,
	createTreeWalker &&
		createTreeWalker(document, 1 /*NodeFilter.SHOW_ELEMENT*/),
)

/**
 * Unwraps `value` and returns `element` if result is a `Node`, else
 * `undefined` in the case isn't a `Node`
 *
 * @template T
 * @param {T} value - Maybe function
 * @param {...unknown} args? - Arguments
 * @returns {DOMElement | T | undefined}
 */
export function getValueElement(value, ...args) {
	const element = getValueWithArguments(value, ...args)
	return element instanceof Node
		? /** @type DOMElement */ (element)
		: undefined
}
