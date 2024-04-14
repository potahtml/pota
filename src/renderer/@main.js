// REACTIVITE PRIMITIVES

import {
	cleanup,
	Context,
	effect,
	memo,
	root,
	signal,
	untrack,
} from '../lib/reactivity/reactive.js'

import { isReactive } from '../lib/reactivity/isReactive.js'

// CONSTANTS

import { $class, $map, NS } from '../constants.js'

// LIB

import {
	flat,
	freeze,
	isArray,
	isFunction,
	isObject,
	iterator,
	nothing,
	removeFromArray,
	stringify,
	toArray,
} from '../lib/std/@main.js'

import { Symbol } from '../lib/std/Symbol.js'

// RENDERER LIB

import { isComponent } from '../lib/component/isComponent.js'
import { isComponentable } from '../lib/component/isComponentable.js'
import { markComponent } from '../lib/component/markComponent.js'

import { ready } from './scheduler.js'

// PROPERTIES / ATTRIBUTES

import { assignProps } from './props/@main.js'

// ELEMENTS

import {
	adoptedStyleSheets,
	createElement,
	createElementNS,
	createTextNode,
	toDiff,
} from '../lib/dom/elements.js'

// STATE

const Components = new Map()
const WeakComponents = new WeakMap()

const useXMLNS = context()

// COMPONENTS

/** Used by the JSX transform, as <>...</> or <Fragment>...</Fragment>. */
export const Fragment = Symbol()

/**
 * Creates components for things. When props argument is given, the
 * props become fixed. When props argument is ommited, it allows you
 * to keep calling the returned function with new props. Returns a
 * function because we need to render from parent to children instead
 * of from children to parent. This allows to properly set the
 * reactivity tree (think of nested effects that clear inner effects,
 * context, etc).
 *
 * @param {string | Function | Element | object | symbol} value -
 *   Component
 * @param {any} [props] Object
 * @param {any} [key]
 * @url https://pota.quack.uy/Component
 */

export function Component(value, props, key) {
	if (value === Fragment) {
		return props.children
	}

	/** Freaking automatic transform sends the key via a 3rd argument */
	if (key !== undefined) {
		if (props === undefined) {
			props = { key }
		} else {
			props.key = key
		}
	}

	/** Freeze props so isnt directly writable */
	freeze(props)

	/**
	 * Create a callable function to pass `props`. When `props` its not
	 * defined it allows the user to make a `Factory` of components,
	 * when `props` its defined the `props` are fixed.
	 */

	return props === undefined
		? Factory(value)
		: markComponent(Factory(value).bind(null, props))
}

/**
 * Creates a component that could be called with a props object
 *
 * @param {Componenteable} value
 * @returns {Component}
 */

function Factory(value) {
	if (isComponent(value)) {
		return value
	}

	const isWeak = isObject(value)

	let component = isWeak
		? WeakComponents.get(value)
		: Components.get(value)

	if (component) {
		return component
	}

	switch (typeof value) {
		case 'string': {
			// string component, 'div' becomes <div>
			component = createTag.bind(null, value)
			break
		}
		case 'function': {
			if ($class in value) {
				// class component <MyComponent../>
				component = createClass.bind(null, value)
				break
			}

			/**
			 * ```js
			 * const [Count, setCount] = signal(1)
			 * return <Count />
			 * ```
			 */
			if (isReactive(value)) {
				component = createAnything.bind(null, value)
				break
			}

			// function component <MyComponent../>
			component = value
			break
		}
		default: {
			if (value instanceof Node) {
				// node component <div>
				component = createNode.bind(null, value)
				break
			}

			component = createAnything.bind(null, value)
			break
		}
	}

	// save in cache
	isWeak
		? WeakComponents.set(value, component)
		: Components.set(value, component)

	return markComponent(component)
}

function createClass(value, props) {
	const i = new value()
	i.ready && ready(i.ready.bind(i))
	i.cleanup && cleanup(i.cleanup.bind(i))

	return i.render(props)
}

function createAnything(value, props) {
	return value
}

/**
 * Creates a x/html element from a tagName
 *
 * @param {string} tagName
 * @param {Props} props
 * @returns {Elements} Element
 */
function createTag(tagName, props) {
	// namespace
	// use props xmlns or special case svg, math, etc in case of missing xmlns attribute
	const ns = props.xmlns || NS[tagName]
	const nsContext = useXMLNS()

	if (ns && ns !== nsContext) {
		// the ns changed, use the new xmlns
		return useXMLNS(ns, () =>
			createNode(createElementNS(ns, tagName), props),
		)
	}
	// foreignObject is created with current xmlns
	// reset back to html (default browser behaviour)
	if (nsContext && tagName === 'foreignObject') {
		return useXMLNS(NS.html, () =>
			createNode(createElementNS(nsContext, tagName), props),
		)
	}

	return createNode(
		nsContext
			? createElementNS(nsContext, tagName)
			: createElement(tagName),
		props,
	)
}

/**
 * Assigns props to an element and creates its children
 *
 * @param {Elements} node
 * @param {Props} props
 * @returns {Elements} Element
 */
function createNode(node, props) {
	if (props) {
		assignProps(node, props)

		createChildren(node, props.children)
	}
	return node
}

/**
 * Creates the children for a parent
 *
 * @param {Elements} parent
 * @param {Children} child
 * @param {boolean} [relative]
 * @returns {Children}
 */
function createChildren(parent, child, relative) {
	switch (typeof child) {
		// string/number
		case 'string':
		case 'number': {
			return insertNode(parent, createTextNode(child), relative)
		}

		case 'function': {
			// component
			if (isComponent(child)) {
				return createChildren(parent, untrack(child), relative)
			}

			let node = []

			// signal/memo/external/user provided function
			// needs placeholder to stay in position
			parent = createPlaceholder(
				parent,
				undefined /*child.name*/,
				relative,
			)

			// For
			if ($map in child) {
				effect(() => {
					node = toDiff(
						node,
						child(child => {
							/**
							 * Wrap the item with placeholders, to avoid resolving
							 * and for easy re-arrangement
							 */
							const begin = createPlaceholder(
								parent,
								undefined /*begin*/,
								true,
							)
							const end = createPlaceholder(
								parent,
								undefined /*end*/,
								true,
							)
							return [begin, createChildren(end, child, true), end]
						}),
					)
				})

				cleanup(() => {
					toDiff(node)
					parent.remove()
				})
				return [node, parent]
			}

			// maybe a signal so needs an effect
			effect(() => {
				node = toDiff(node, createChildren(parent, child(), true))
			})

			cleanup(() => {
				toDiff(node)
				parent.remove()
			})
			/**
			 * A placeholder is created and added to the document but doesnt
			 * form part of the children. The placeholder needs to be
			 * returned so it forms part of the group of children. If
			 * children are moved and the placeholder is not moved with
			 * them, then, whenever children update these will be at the
			 * wrong place. wrong place: where the placeholder is and not
			 * where the children were moved to
			 */
			return [node, parent]
		}

		case 'object': {
			// children/fragments
			if (isArray(child)) {
				if (child.length === 1) {
					return createChildren(parent, child[0], relative)
				}
				return child.map(child =>
					createChildren(parent, child, relative),
				)
			}

			// Node/DocumentFragment
			if (child instanceof Node) {
				/**
				 * DocumentFragment are special as only the children get added
				 * to the document and the document becomes empty. If we dont
				 * insert them 1 by 1 then we wont have a reference to them
				 * for deletion on cleanup with node.remove()
				 */
				if (child instanceof DocumentFragment) {
					return createChildren(
						parent,
						toArray(child.childNodes),
						relative,
					)
				}
				return insertNode(parent, child, relative)
			}

			/**
			 * The value is `null`, as in {null} or like a show returning
			 * `null` on the falsy case
			 */
			if (child === null) {
				return undefined
			}

			// async components
			if ('then' in child) {
				const [value, setValue] = signal(undefined)

				const onResult = result =>
					parent.isConnected && setValue(result)

				child.then(onResult).catch(onResult)
				return createChildren(parent, value, relative)
			}

			// iterable/Map/Set/NodeList
			if (iterator in child) {
				return createChildren(
					parent,
					toArray(child.values()),
					relative,
				)
			}

			// CSSStyleSheet
			if (child instanceof CSSStyleSheet) {
				adoptedStyleSheets.push(child)
				cleanup(() => {
					removeFromArray(adoptedStyleSheets, child)
				})
				return null
			}

			// object.toString fancy objects
			return createChildren(
				parent,
				// Object.create(null) would fail to convert to string
				'toString' in child ? child.toString() : stringify(child),
				relative,
			)
		}
		case 'undefined': {
			return undefined
		}
		default: {
			// boolean/bigint/symbol/catch all
			// toString() is needed for `Symbol`
			return insertNode(
				parent,
				createTextNode(child.toString()),
				relative,
			)
		}
	}
}

/**
 * Creates placeholder to keep nodes in position
 *
 * @param {Elements} parent
 * @param {unknown} text
 * @param {boolean} [relative]
 * @returns {Elements}
 */
const createPlaceholder = (parent, text, relative) => {
	return insertNode(parent, createTextNode(''), relative)

	/* dev */
	return insertNode(
		parent,
		document.createComment(
			(text || '') + (relative ? ' relative' : ''),
		),
		relative,
	)
}

let headQuerySelector

/**
 * Adds the element to the document
 *
 * @param {Elements} parent
 * @param {Elements} node
 * @param {boolean} [relative]
 * @returns {Elements}
 */

function insertNode(parent, node, relative) {
	// special case `head`
	if (parent === document.head) {
		if (!headQuerySelector) {
			const head = document.head
			headQuerySelector = head.querySelector.bind(head)
		}

		const name = node.tagName

		// search for tags that should be unique
		let prev
		if (name === 'TITLE') {
			prev = headQuerySelector('title')
		} else if (name === 'META') {
			prev =
				headQuerySelector(
					'meta[name="' + node.getAttribute('name') + '"]',
				) ||
				headQuerySelector(
					'meta[property="' + node.getAttribute('property') + '"]',
				)
		} else if (name === 'LINK' && node.rel === 'canonical') {
			prev = headQuerySelector('link[rel="canonical"]')
		}

		// replace old node if there's any
		prev ? prev.replaceWith(node) : parent.appendChild(node)
	} else {
		relative ? parent.before(node) : parent.appendChild(node)
	}

	return node
}

// RENDERING

/**
 * Inserts children into a parent
 *
 * @param {any} children - Thing to render
 * @param {Elements | undefined} [parent] - Mount point, defaults to
 *   document.body
 * @param {{ clear?: boolean; relative?: boolean }} [options] -
 *   Mounting options
 * @returns {Function} Disposer
 * @url https://pota.quack.uy/render
 */
export function render(children, parent, options = nothing) {
	const dispose = root(dispose => {
		insert(children, parent, options)
		return dispose
	})

	// run dispose when the parent scope disposes
	cleanup(dispose)

	return dispose
}

/**
 * @param {any} children - Thing to render
 * @param {Elements} [parent] - Mount point, defaults to
 *   `document.body`
 * @param {{ clear?: boolean; relative?: boolean }} [options] -
 *   Mounting options
 */
function insert(children, parent = document.body, options) {
	if (options.clear && parent) parent.textContent = ''

	const node = createChildren(
		parent,
		isComponentable(children) ? Factory(children) : children,
		options.relative,
	)

	cleanup(() => toDiff([node].flat(Infinity)))

	return node
}

/**
 * Creates and returns HTML Elements for `children`
 *
 * @param {Children} children
 * @returns {Children}
 * @url https://pota.quack.uy/toHTML
 */
export const toHTML = children =>
	/**
	 * DocumentFragment is transformed to an `Array` of `Node/Element`,
	 * that way we can keep a reference to the nodes. Because when the
	 * DocumentFragment is used, it removes the nodes from the
	 * DocumentFragment and then we will lose the reference.
	 */

	flat(toHTMLFragment(children).childNodes)

/**
 * Creates and returns a DocumentFragment for `children`
 *
 * @param {Children} children
 * @returns {DocumentFragment}
 * @url https://pota.quack.uy/toHTML
 */
export function toHTMLFragment(children) {
	const fragment = new DocumentFragment()
	createChildren(fragment, children)

	return fragment
}

/**
 * Resolves and returns `children` in a memo
 *
 * @param {Function | Children} fn
 * @returns {Signal} Memo
 * @url https://pota.quack.uy/resolve
 */
export function resolve(fn) {
	const children = isFunction(fn) ? memo(fn) : () => fn
	return memo(() => unwrap(children()))
}

/**
 * Recursively unwrap children functions
 *
 * @param {Children} children
 * @returns {Children}
 */
function unwrap(children) {
	if (isFunction(children)) {
		return unwrap(children())
	}
	if (isArray(children)) {
		const childrens = []
		for (let child of children) {
			child = unwrap(child)
			isArray(child)
				? childrens.push(...child)
				: childrens.push(child)
		}
		return childrens
	}

	return children
}

/**
 * Creates a context and returns a function to get or set the value
 *
 * @param {any} [defaultValue] - Default value for the context
 * @returns {Function & { Provider: ({ value }) => Elements }}
 *   Context
 * @url https://pota.quack.uy/Reactivity/Context
 */
export function context(defaultValue = undefined) {
	/** @type {Function & { Provider: ({ value }) => Elements }} */
	const ctx = Context(defaultValue)

	/**
	 * Sets the `value` for the context
	 *
	 * @param {object} props
	 * @param {any} props.value
	 * @param {Children} [props.children]
	 * @returns {Children} Children
	 * @url https://pota.quack.uy/Reactivity/Context
	 */
	ctx.Provider = props =>
		ctx(props.value, () => toHTML(props.children))

	return ctx
}
