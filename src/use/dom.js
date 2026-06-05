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
 * @url https://pota.quack.uy/use/dom/isConnected
 */
export const isConnected = node => node.isConnected

/** @returns {Element | null} The currently focused element. */
export const activeElement = () => document.activeElement

/**
 * Returns `true` when a media element is actively playing — using the
 * standard heuristic of "currentTime advancing, not paused, not
 * ended, and `readyState >= HAVE_FUTURE_DATA` (3)". Useful as a
 * one-shot check inside event handlers; for reactive play-state, wrap
 * a signal around `play` / `pause` / `ended` listeners.
 *
 * @param {HTMLMediaElement} el
 * @returns {boolean}
 * @url https://pota.quack.uy/use/dom/isPlaying
 */
export const isPlaying = el =>
	el.currentTime > 0 && !el.paused && !el.ended && el.readyState > 2

/** @returns {Element | undefined} The root `<html>` element if available. */
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

/**
 * Cleans a text value using the same whitespace rules JSX applies to
 * `JSXText` children: strip leading/trailing whitespace adjacent to
 * tags, drop blank lines, and add a single trailing space to non-last
 * lines that survived. Returns `''` when the input was pure
 * whitespace. Mirrors `cleanJSXElementLiteralChild` in
 * `babel-preset/transform/children.js` so xml↔jsx round-trips don't
 * have to fix up whitespace.
 *
 * @param {string} value
 * @returns {string}
 * @url https://pota.quack.uy/use/dom/cleanJSXText
 */
export function cleanJSXText(value) {
	const lines = value.split(/\r\n|\n|\r/)
	let lastNonEmptyLine = 0
	for (let i = 0; i < lines.length; i++) {
		if (/[^ \t]/.test(lines[i])) {
			lastNonEmptyLine = i
		}
	}
	let str = ''
	for (let i = 0; i < lines.length; i++) {
		let trimmedLine = lines[i].replace(/\t/g, ' ')
		if (i !== 0) trimmedLine = trimmedLine.replace(/^ +/, '')
		if (i !== lines.length - 1)
			trimmedLine = trimmedLine.replace(/ +$/, '')
		if (trimmedLine) {
			if (i !== lastNonEmptyLine) trimmedLine += ' '
			str += trimmedLine
		}
	}
	return str
}

export const importNode = bind('importNode')

export const createTreeWalker = bind('createTreeWalker')

// part

/**
 * Adds a part token to an element, enabling ::part styling.
 *
 * @param {Element & { part: DOMTokenList }} node
 * @param {string} partName
 * @returns {void}
 * @url https://pota.quack.uy/use/dom/addPart
 */
export const addPart = (node, partName) => node.part.add(partName)

/**
 * Removes a part token from an element.
 *
 * @param {Element & { part: DOMTokenList }} node
 * @param {string} partName
 * @returns {void}
 * @url https://pota.quack.uy/use/dom/removePart
 */
export const removePart = (node, partName) =>
	node.part.remove(partName)

// tokenList

/**
 * Splits a string by whitespace into tokens; returns `emptyArray` for
 * falsy or whitespace-only input.
 *
 * @param {string | undefined | null} s
 * @returns {string[]}
 * @url https://pota.quack.uy/use/dom/tokenList
 */
export const tokenList = s => {
	s = s?.trim()
	return s
		? s.split(/\s+/)
		: /** @type string[] */ (/** @type unknown */ (emptyArray))
}

/**
 * Adds CSS classes to an element using either a string or an array.
 *
 * @param {Element} node
 * @param {string | string[]} className
 * @url https://pota.quack.uy/use/dom/addClass
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
 * @url https://pota.quack.uy/use/dom/removeClass
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
 * @url https://pota.quack.uy/use/dom/setAttribute
 */
export const setAttribute = (node, name, value) =>
	node.setAttribute(name, value)

/**
 * Determines whether an attribute exists on a node.
 *
 * @param {Element} node
 * @param {string} name
 * @returns {boolean}
 * @url https://pota.quack.uy/use/dom/hasAttribute
 */
export const hasAttribute = (node, name) => node.hasAttribute(name)

/**
 * Removes an attribute from a node.
 *
 * @param {Element} node
 * @param {string} name
 * @url https://pota.quack.uy/use/dom/removeAttribute
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
 * @url https://pota.quack.uy/use/dom/querySelector
 */
export const querySelector = (node, query) =>
	node.querySelector(query)

/**
 * Finds all matching descendants of `node` using a CSS selector.
 *
 * @param {ParentNode} node
 * @param {string} query
 * @returns {NodeListOf<Element>}
 * @url https://pota.quack.uy/use/dom/querySelectorAll
 */
export const querySelectorAll = (node, query) =>
	node.querySelectorAll(query)

/**
 * Returns `document` for element. That could be a `shadowRoot`
 *
 * @template {Element | DocumentFragment} T
 * @param {T} node
 * @returns {Document | ShadowRoot}
 * @url https://pota.quack.uy/use/dom/getDocumentForElement
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
 * @url https://pota.quack.uy/use/dom/walkElements
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
	node.nodeType === 1 && max > 0 && nodes.push(node)

	walk.currentNode = node

	while (nodes.length < max && (node = walk.nextNode())) {
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
 * @url https://pota.quack.uy/use/dom/getValueElement
 */
export function getValueElement(value, ...args) {
	const element = getValueWithArguments(value, ...args)
	return element instanceof Node ? element : undefined
}

/**
 * Removes from the DOM `prev` elements not found in `next`
 *
 * @param {DOMElement[]} [prev=[]] - Array with previous elements.
 *   Default is `[]`
 * @param {DOMElement[]} [next=[]] - Array with next elements. Default
 *   is `[]`
 * @param {boolean} [short=false] - Whether to use fast clear. Default
 *   is `false`
 * @returns {DOMElement[]} The next array of elements
 * @url https://pota.quack.uy/use/dom/toDiff
 */
export function toDiff(prev = [], next = [], short = false) {
	// if theres something to remove
	if (prev.length) {
		// fast clear
		if (short && next.length === 0) {
			const parent = prev[0] && prev[0].parentNode
			if (parent) {
				// + 1 because of the original placeholder
				if (prev.length + 1 === parent.childNodes.length) {
					// console.log('fast clear')
					// save the placeholder
					const lastChild = parent.lastChild
					parent.textContent = ''
					parent.appendChild(lastChild)
					return next
				}
			} else {
				// console.log('parent gone already')
				return next
			}
		}

		if (next.length === 0) {
			// console.log('removing each separately')
			for (const item of prev) {
				item && item.remove()
			}
			return next
		}

		for (const item of prev) {
			// console.log('removing some')
			if (item && !next.includes(item)) {
				item.remove()
			}
		}
	}
	return next
}
