// REACTIVITE PRIMITIVES

import {
	root,
	renderEffect,
	cleanup,
	untrack,
	signal,
	memo,
	withOwner,
} from '../lib/reactivity/primitives/solid.js'

// REACTIVE UTILITIES

import { isReactive } from '../lib/reactivity/isReactive.js'

// CONSTANTS

import { $internal, $map, $meta, NS } from '../constants.js'

// LIB

import {
	empty,
	isArray,
	call,
	toArray,
	contextSimple,
	property,
	removeFromArray,
	isFunction,
} from '../lib/std/@main.js'

// RENDERER LIB

import {
	isClassComponent,
	isComponent,
	isComponentable,
	markComponent,
} from '../lib/comp/@main.js'

import { onFinally, onReady } from './scheduler.js'

// PROPERTIES / ATTRIBUTES

import { assignProps } from './props/@main.js'

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

// COMPONENTS

/**
 * Used by the JSX transform, as <>...</> or <Fragment>...</Fragment>.
 * This function is empty because its given to `Component` via the
 * transformer and we dont even need to run it. Avoid the temptation
 * to replace this for `noop` from `lib`.
 */
export const Fragment = () => {}

/**
 * Used by the JSX transform. `Component` is not supposed to be used
 * in user land. Returns a function because we need to render from
 * parent to children instead of from children to parent. This allows
 * to properly set the reactivity tree (think of nested effects that
 * clear inner effects, context, etc). Additionally, this reversed
 * flow allows to access parent when creating children
 *
 * @param {string | Function | Element | object} value - Component
 * @param {any} props Object
 */

export function Component(value, props) {
	// special case fragments, these are arrays and dont need untrack nor props
	if (value === Fragment) {
		return props.children
	}

	// make a component, a callable function to pass `props`
	value = Factory(value)

	// freeze props so isnt directly writable
	Object.freeze(props)

	/**
	 * The scope/context is used to hold the parent to be able to tell
	 * if dynamic children are XML
	 */
	const scope = Scope()

	/**
	 * Create component instance with props, and a scope/context
	 * initially set to an empty object
	 */
	return markComponent(() => value(props, scope))
}

const Scope = () => ({
	namespaceURI: undefined,
	parent: undefined,
})

const Components = new Map()

// clear the cache after each run
onFinally(() => Components.clear())

/**
 * Creates a component which is an untracked function that could be
 * called with a props object
 *
 * @param {Componenteable} value
 * @returns {Component}
 */

export function Factory(value) {
	if (isComponent(value)) {
		return value
	}

	let component = Components.get(value)
	if (component) {
		return component
	}

	switch (typeof value) {
		case 'string': {
			// a string component, 'div' becomes <div>
			component = (props = empty(), scope = Scope()) =>
				createTag(value, props, scope)
			break
		}
		case 'function': {
			if (isClassComponent(value)) {
				// a class component <MyComponent../>
				component = (props = empty()) =>
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
			component = (props = empty(), scope = Scope()) =>
				untrack(() => value(props, scope))
			break
		}
		default: {
			if (value instanceof Node) {
				// an actual node component <div>
				component = (props = empty(), scope = Scope()) =>
					createNode(value, props, scope)
				break
			}

			component = () => value
			break
		}
	}

	// save in cache
	Components.set(value, component)

	return markComponent(component)
}

/**
 * Keeps track of parentNode for `xmlns` spreading to children.
 * Defaults to empty object so parentNode.namespaceURI doesnt throw
 */

const useParentNode = contextSimple(empty())

/**
 * Creates a x/html element from a tagName
 *
 * @param {string} tagName
 * @param {Props} props
 * @param {Props} scope
 * @returns {Elements} Element
 */
function createTag(tagName, props, scope) {
	const parentNode = useParentNode()

	// get the namespace
	const ns = props.xmlns
		? props.xmlns // the prop contains the namespace
		: parentNode.namespaceURI && parentNode.namespaceURI !== NS.html // this works on first run
			? parentNode.namespaceURI // the parent contains the namespace
			: scope.parent?.namespaceURI // used after the first run, once reactivity takes over
				? scope.parent.namespaceURI // the parent contains the namespace
				: NS[tagName] // special case svg, math in case of missing xmlns attribute

	return createNode(
		ns ? createElementNS(ns, tagName) : createElement(tagName),
		props,
		scope,
	)
}

/**
 * Assigns props to an element and creates its children
 *
 * @param {Elements} node
 * @param {Props} props
 * @param {Props} scope
 * @returns {Elements} Element
 */
function createNode(node, props, scope) {
	if (node.namespaceURI !== NS.html) {
		/**
		 * Assign the scope to the node when the namespace is not html .
		 * Allows to lookup parent node for xmlns
		 */
		property(node, $meta, scope, true)

		scope.namespaceURI = node.namespaceURI

		const parentNode = useParentNode()

		/**
		 * On first run this will hold a value. Once reactivity takes over
		 * (like a Show), then, it wont and we use the old reference to
		 * the parent, which is already saved on the scope from the
		 * previous run
		 */
		const parentScope = property(parentNode, $meta)
		if (parentScope) {
			scope.parent = parentScope
		}
	}

	// get rid of the node on cleanup
	cleanup(() => {
		const onUnmount = property(node, 'onUnmount')
		if (onUnmount) {
			for (const fn of onUnmount) {
				call(fn, node)
			}
		}
		// remove from the document
		node.remove()
	})

	// assign the props to the node
	assignProps(node, props)

	/**
	 * Insert children. Children will be `undefined` when there are no
	 * children at all, example `<br/>`
	 */
	if (props.children !== undefined) {
		useParentNode(node, () => {
			createChildren(node, props.children)
		})
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

			// For
			if ($map in child) {
				// signal: needs an effect
				let node
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
			let node
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
				 * DocumentFragment are special as only the childs get added
				 * to the document and the document becomes empty. If we dont
				 * insert them 1 by 1 then we wont have a reference to them
				 * for deletion, as DocumentFragment.remove() doesnt exists
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
				'toString' in child
					? child.toString()
					: // object.create(null) would fail to convert to string
						JSON.stringify(child),
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

	// get rid of children nodes on cleanup
	cleanup(() => node.remove())

	return node
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
 */
export function render(children, parent, options = empty()) {
	const dispose = root(dispose => {
		insert(children, parent, options)
		return dispose
	})

	/**
	 * Listener for mount point removal. Assumes that mount point was
	 * created by this lib, else would need mutation observer
	 */
	const onUnmount = parent ? property(parent, 'onUnmount', []) : []

	const disposer = () => {
		removeFromArray(onUnmount, disposer)
		dispose()
	}

	// run dispose when the mount point is removed from the document
	onUnmount.push(disposer)

	// run dispose when the parent scope disposes
	// todo: should do this only when its owned
	cleanup(disposer)

	return disposer
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
 * @param {Symbol} [removePlaceholder]
 * @returns {Children}
 */
export function toHTML(children, removePlaceholder) {
	if (children instanceof Node) {
		return children
	}
	const fragment = createFragment()
	createChildren(fragment, children)

	const childNodes = fragment.childNodes

	// workaround for html returning a sub-fix placeholder
	removePlaceholder === $internal &&
		childNodes.length === 2 &&
		childNodes[1].nodeType === 3 &&
		childNodes[1].data === '' &&
		childNodes[1].remove()

	return childNodes.length === 1 ? childNodes[0] : fragment
}

/**
 * Resolves and returns `children` in a memo
 *
 * @param {Function | Children} fn
 * @returns {Signal} Memo
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
