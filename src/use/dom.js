import {
	emptyArray,
	getValueWithArguments,
	isArray,
	window,
} from '../lib/std.js'

export const document = /** @type {Document} */ (window.document)

export const head = document?.head

/**
 * Checks whether a node is connected to a document tree.
 *
 * @param {Node} node
 * @returns {boolean}
 */
export const isConnected = node => node.isConnected

/** @returns {Element | null} The currently focused element. */
export const activeElement = () => document.activeElement

/**
 * @returns {Element | undefined} The root `<html>` element if
 *   available.
 */
export const documentElement = document?.documentElement

/** DocumentFragment constructor exposed for convenience. */
export const DocumentFragment = window.DocumentFragment

/**
 * Safely binds a document method so it can be called later.
 *
 * @param {string} fn
 * @returns {Function | undefined}
 */
const bind = fn => document && document[fn].bind(document)

export const createElement = bind('createElement')
export const createElementNS = bind('createElementNS')
export const createTextNode = bind('createTextNode')
export const createComment = bind('createComment')

export const importNode = bind('importNode')

export const createTreeWalker = bind('createTreeWalker')

// part

/**
 * Adds a part token to an element, enabling ::part styling.
 *
 * @param {Element & { part: DOMTokenList }} node
 * @param {string} partName
 * @returns {void}
 */
export const addPart = (node, partName) => node.part.add(partName)

/**
 * Removes a part token from an element.
 *
 * @param {Element & { part: DOMTokenList }} node
 * @param {string} partName
 * @returns {void}
 */
export const removePart = (node, partName) =>
	node.part.remove(partName)

// tokenList

/**
 * Splits a string by whitespace into tokens; returns `emptyArray` for
 * falsy input.
 *
 * @param {string | undefined | null} s
 * @returns {string[]}
 */
export const tokenList = s =>
	s
		? s.trim().split(/\s+/)
		: /** @type string[] */ (/** @type unknown */ emptyArray)

/**
 * Adds CSS classes to an element using either a string or an array.
 *
 * @param {Element} node
 * @param {string | string[]} className
 */
export const addClass = (node, className) =>
	className.length &&
	node.classList.add(
		...(isArray(className) ? className : tokenList(className)),
	)

/**
 * Removes CSS classes from an element using either a string or an
 * array.
 *
 * @param {Element} node
 * @param {string | string[]} className
 */
export const removeClass = (node, className) =>
	className.length &&
	node.classList.remove(
		...(isArray(className) ? className : tokenList(className)),
	)

// attributes

/**
 * Sets an attribute on a node.
 *
 * @param {Element} node
 * @param {string} name
 * @param {string} value
 */
export const setAttribute = (node, name, value) =>
	node.setAttribute(name, value)

/**
 * Determines whether an attribute exists on a node.
 *
 * @param {Element} node
 * @param {string} name
 * @returns {boolean}
 */
export const hasAttribute = (node, name) => node.hasAttribute(name)

/**
 * Removes an attribute from a node.
 *
 * @param {Element} node
 * @param {string} name
 */
export const removeAttribute = (node, name) =>
	node.removeAttribute(name)

// selector

/**
 * Finds the first matching descendant of `node` using a CSS selector.
 *
 * @param {ParentNode} node
 * @param {string} query
 * @returns {Element | null}
 */
export const querySelector = (node, query) =>
	node.querySelector(query)

/**
 * Finds all matching descendants of `node` using a CSS selector.
 *
 * @param {ParentNode} node
 * @param {string} query
 * @returns {NodeListOf<Element>}
 */
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

/**
 * Traverses element nodes depth-first collecting up to `max` results.
 *
 * @param {TreeWalker} walk
 * @param {Node} node
 * @param {number} [max=Infinity] Default is `Infinity`
 * @param {Node[]} [nodes=[]] Default is `[]`
 * @returns {Node[]}
 */
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
	return element instanceof Node ? element : undefined
}
