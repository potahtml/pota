// REACTIVITE PRIMITIVES

import {
	root,
	renderEffect,
	cleanup,
	untrack,
	signal,
	memo,
	withOwner,
	owner,
} from '../lib/reactivity/primitives/solid.js'

// REACTIVE UTILITIES

import { isReactive } from '../lib/reactivity/isReactive.js'

// CONSTANTS

import { $class, $map, NS } from '../constants.js'

// LIB

import {
	empty,
	isArray,
	call,
	toArray,
	property,
	removeFromArray,
	isFunction,
	weakStore,
	freeze,
	flat,
} from '../lib/std/@main.js'

// RENDERER LIB

import {
	isComponent,
	isComponentable,
	markComponent,
} from '../lib/comp/@main.js'

import { onFinally, onReady } from './scheduler.js'

// PROPERTIES / ATTRIBUTES

import { assignProps } from './props/@main.js'
import { context } from './context.js'

// DOCUMENT

/**
 * It needs to untrack because custom elements may have callbacks
 * reading signals when elements are created.
 */
export const createElement = tagName =>
	untrack(() => document.createElement(tagName))
const createElementNS = (ns, name) =>
	untrack(() => document.createElementNS(ns, name))
const createElementText = text => document.createTextNode(text)
const createFragment = () => new DocumentFragment()

const nodeClear = node => (node.textContent = '')

// STATE

const Components = new Map()
const WeakComponents = new WeakMap()
const defaultProps = freeze(empty())
const useXMLNS = context()

// COMPONENTS

/**
 * Used by the JSX transform, as <>...</> or <Fragment>...</Fragment>.
 * This function is empty because its given to `Component` via the
 * transformer and we dont even need to run it. Avoid the temptation
 * to replace this for `noop` from `lib`.
 */
export const Fragment = () => {}

/**
 * Creates components for things. When props argument is given, the
 * props become fixed. When props argument is ommited, it allows you
 * to keep calling the returned function with new props.
 *
 * @param {string | Function | Element | object} value - Component
 * @param {any} [props] Object
 * @url https://pota.quack.uy/Component
 */

export function Component(value, props = undefined) {
	/**
	 * Internal comment: Returns a function because we need to render
	 * from parent to children instead of from children to parent. This
	 * allows to properly set the reactivity tree (think of nested
	 * effects that clear inner effects, context, etc). Additionally,
	 * this reversed flow allows to access parent when creating
	 * children.
	 */
	// special case fragments, these are arrays and dont need untrack nor props
	if (value === Fragment) {
		return props.children
	}

	// freeze props so isnt directly writable
	freeze(props)

	/**
	 * Create a callable function to pass `props`. When props its not
	 * defined it allows the user to make a Factory of components, when
	 * props its defined the props are fixed.
	 */

	return props === undefined
		? Factory(value)
		: markComponent(Factory(value).bind(null, props))
}

/**
 * Creates a component which is an untracked function that could be
 * called with a props object
 *
 * @param {Componenteable} value
 * @returns {Component}
 */

function Factory(value) {
	if (isComponent(value)) {
		return value
	}

	let component =
		typeof value === 'object'
			? WeakComponents.get(value)
			: Components.get(value)
	if (component) {
		return component
	}

	switch (typeof value) {
		case 'string': {
			// a string component, 'div' becomes <div>
			component = (props = defaultProps) => createTag(value, props)
			break
		}
		case 'function': {
			if ($class in value) {
				// a class component <MyComponent../>
				component = (props = defaultProps) =>
					untrack(() => {
						const i = new value()
						i.onReady && onReady(i.onReady.bind(i))
						i.onCleanup && cleanup(i.onCleanup.bind(i))

						return i.render(props)
					})
				break
			}

			/**
			 * ```js
			 * const [Count, setCount] = signal(1)
			 * return <Count />
			 * ```
			 */
			if (isReactive(value)) {
				component = () => value
				break
			}

			// a function component <MyComponent../>
			component = (props = defaultProps) =>
				untrack(() => value(props))
			break
		}
		default: {
			if (value instanceof Node) {
				// an actual node component <div>
				component = (props = defaultProps) => createNode(value, props)
				break
			}

			component = () => value
			break
		}
	}

	// save in cache
	typeof value === 'object'
		? WeakComponents.set(value, component)
		: Components.set(value, component)

	return markComponent(component)
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
	// special case svg, math in case of missing xmlns attribute
	const ns = props.xmlns || NS[tagName]
	const nsContext = useXMLNS()

	if (ns && ns !== nsContext) {
		// the ns changed, use the new xmlns
		return useXMLNS(ns, () =>
			createNode(createElementNS(ns, tagName), props),
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
	// cleanup the node on disposal
	nodeCleanup(node)

	// assign the props to the node
	assignProps(node, props)

	/**
	 * Insert children. Children will be `undefined` when there are no
	 * children at all, example `<br/>`
	 */
	if (props.children !== undefined) {
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
			return insertNode(parent, createElementText(child), relative)
		}

		case 'function': {
			// component
			if (isComponent(child)) {
				return createChildren(parent, child(), relative)
			}

			let node

			// For
			if ($map in child) {
				// signal: needs an effect
				renderEffect(() => {
					node = child(child => {
						/**
						 * Wrap the item with placeholders, to avoid resolving and
						 * for easy re-arrangement
						 */
						const begin = createPlaceholder(parent, 'begin', true)
						const end = createPlaceholder(parent, 'end', true)

						return [begin, createChildren(end, child, true), end]
					})
				})
				return node
			}

			// signal/memo/external/user provided function
			// needs placeholder to stay in position
			parent = createPlaceholder(parent, child.name, relative)

			// maybe a signal so needs an effect

			renderEffect(() => {
				node = createChildren(parent, child(), true)
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
					return toArray(child.childNodes).map(child =>
						createChildren(parent, child, relative),
					)
				}
				return insertNode(parent, child, relative)
			}

			/**
			 * The value is `null`, as in {null} or like a show returning
			 * `null` on the falsy case
			 */
			if (child === null) {
				return null
			}

			// async components
			if ('then' in child) {
				const [value, setValue] = signal(null)
				/**
				 * If the result of the promise is a function it runs it with
				 * an owner. Else it will just use the return value
				 */
				const owned = withOwner()
				child.then(
					r =>
						parent.isConnected &&
						setValue(isFunction(r) ? owned(r) : r),
				)
				return createChildren(parent, value, relative)
			}

			// iterable/Map/Set/NodeList
			if (Symbol.iterator in child) {
				return toArray(child.values()).map(child =>
					createChildren(parent, child, relative),
				)
			}

			// object.toString fancy objects
			return createChildren(
				parent,
				// object.create(null) would fail to convert to string
				'toString' in child
					? child.toString()
					: JSON.stringify(child),
				relative,
			)
		}
		case 'undefined': {
			return null
		}
		default: {
			// boolean/bigint/symbol/catch all
			// toString() is needed for `Symbol`
			return insertNode(
				parent,
				createElementText(child.toString()),
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
const createPlaceholder = (parent, text, relative) =>
	/* dev
	return insertNode(
		parent,
		document.createComment(
			(text || '') + (relative ? ' relative' : ''),
		),
		relative,
	)
	*/
	insertNode(parent, createElementText(''), relative)

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
		const querySelector = parent.querySelector.bind(parent)
		const name = node.tagName

		// search for tags that should be unique
		let prev
		if (name === 'TITLE') {
			prev = querySelector('title')
		} else if (name === 'META') {
			prev =
				querySelector(
					'meta[name="' + node.getAttribute('name') + '"]',
				) ||
				querySelector(
					'meta[property="' + node.getAttribute('property') + '"]',
				)
		} else if (name === 'LINK' && node.rel === 'canonical') {
			prev = querySelector('link[rel="canonical"]')
		}
		untrack(() =>
			// replace old node if there's any
			prev ? prev.replaceWith(node) : parent.appendChild(node),
		)
	} else {
		untrack(() =>
			relative ? parent.before(node) : parent.appendChild(node),
		)
	}

	nodeCleanup(node)

	return node
}

// nodes cleanup

const nodeCleanupStore = weakStore()
function nodeCleanup(node) {
	const own = owner()
	// null owners means its never disposed
	if (own) {
		const nodes = nodeCleanupStore.get(own, () => [])

		if (nodes.length === 0) {
			cleanup(() => {
				for (const node of nodes) {
					node.remove()
				}
				nodes.length = 0
			})
		}

		nodes.push(node)
	}
}

// RENDERING

/**
 * Inserts children into a parent
 *
 * @param {any} children - Thing to render
 * @param {Elements | null | undefined} [parent] - Mount point,
 *   defaults to document.body
 * @param {{ clear?: boolean; relative?: boolean }} [options] -
 *   Mounting options
 * @returns {Function} Disposer
 * @url https://pota.quack.uy/render
 */
export function render(children, parent, options = empty()) {
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
 * @param {Elements | null | undefined} [parent] - Mount point,
 *   defaults to `document.body`
 * @param {{ clear?: boolean; relative?: boolean }} [options] -
 *   Mounting options
 */
function insert(children, parent, options = empty()) {
	options.clear && nodeClear(parent)

	return createChildren(
		parent || document.body,
		isComponentable(children) ? Factory(children) : children,
		options.relative,
	)
}

/**
 * Creates and returns HTML Elements for `children`
 *
 * @param {Children} children
 * @returns {Children}
 * @url https://pota.quack.uy/toHTML
 */
export function toHTML(children) {
	const fragment = createFragment()
	createChildren(fragment, children)
	/**
	 * DocumentFragment is transformed to an `Array` of `Node/Element`,
	 * that way we can keep a reference to the nodes. Because when the
	 * DocumentFragment is used, it removes the nodes from the
	 * DocumentFragment and then we will lose the reference.
	 */
	return flat(fragment.childNodes)
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
