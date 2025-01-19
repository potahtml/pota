// CONSTANTS

import { $isClass, $isMap, NS } from './constants.js'

// LIB

import {
	cleanup,
	Context,
	effect,
	isReactive,
	root,
	signal,
	untrack,
} from './lib/reactive.js'

import {
	adoptedStyleSheetsAdd,
	adoptedStyleSheetsRemove,
	createElement,
	createElementNS,
	createTextNode,
	CSSStyleSheet,
	document,
	DocumentFragment,
	flat,
	freeze,
	getDocumentForElement,
	importNode,
	isArray,
	isConnected,
	iterator,
	nothing,
	querySelector,
	resolved,
	stringify,
	toArray,
	walkElements,
} from './lib/std.js'

import {
	isComponent,
	isComponentable,
	markComponent,
} from './lib/reactive.js'

import { onFixes, ready } from './scheduler.js'

// PROPERTIES / ATTRIBUTES

import { assignProps } from './props/@main.js'
import { propsPlugin } from './props/plugin.js'

// STATE

const useXMLNS = context()

// COMPONENTS

/**
 * Used by the regular JSX transform, as `<>...</>` or
 * `<Fragment>...</Fragment>`.
 */
export const Fragment = props => props.children

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
 * @returns {Children}
 * @url https://pota.quack.uy/Component
 */

export function Component(value, props) {
	if (value === Fragment) {
		return props.children
	}

	/** Freeze props so isnt directly writable */
	freeze(props)

	/** Create a callable function to pass `props` */
	const component = Factory(value)

	return props === undefined
		? component
		: markComponent(propsOverride =>
				component(
					propsOverride
						? freeze({ ...props, ...propsOverride })
						: props,
				),
			)
}

/**
 * Creates a component that could be called with a props object
 *
 * @template T
 * @param {any} value
 * @returns {Component}
 */

function Factory(value) {
	if (isComponent(value)) {
		return value
	}

	switch (typeof value) {
		case 'string': {
			// string component, 'div' becomes <div>
			return markComponent(props => createTag(value, props))
		}
		case 'function': {
			if ($isClass in value) {
				// class component <MyComponent../>
				return markComponent(props => createClass(value, props))
			}

			/**
			 * ```js
			 * const [Count, setCount] = signal(1)
			 * return <Count />
			 * ```
			 */
			if (isReactive(value)) {
				return markComponent(() => createAnything(value))
			}

			// function component <MyComponent../>
			// value = value
			return markComponent(value)
		}
		default: {
			if (value instanceof Element) {
				// node component <div>
				return markComponent(props => createNode(value, props))
			}

			return markComponent(() => createAnything(value))
		}
	}
}

export function createComponent(value) {
	const component = Factory(value)

	return props => {
		/** Freeze props so isnt directly writable */
		freeze(props)
		return markComponent(() => component(props))
	}
}

function createClass(value, props) {
	const i = new value()
	i.ready && ready(() => i.ready())
	i.cleanup && cleanup(() => i.cleanup())

	return i.render(props)
}

function createAnything(value) {
	return value
}

/**
 * Creates a x/html element from a tagName
 *
 * @template P
 * @param {TagNames} tagName
 * @param {P} props
 * @returns {Element} Element
 */
function createTag(tagName, props) {
	/**
	 * Namespace, use props xmlns or special case svg, math, etc in case
	 * of missing xmlns attribute
	 */
	const xmlns = props?.xmlns || NS[tagName]

	return withXMLNS(
		xmlns,
		xmlns =>
			createNode(
				xmlns
					? createElementNS(xmlns, tagName)
					: createElement(tagName),
				props,
			),
		tagName,
	)
}

function withXMLNS(xmlns, fn, tagName) {
	const nsContext = useXMLNS()

	if (xmlns && xmlns !== nsContext) {
		// the xmlns changed, use the new xmlns
		return useXMLNS(xmlns, () => fn(xmlns))
	}

	/**
	 * `foreignObject` children are created with html xmlns (default
	 * browser behaviour)
	 */
	if (nsContext && tagName === 'foreignObject') {
		return useXMLNS(NS.html, () => fn(nsContext))
	}

	return fn(nsContext)
}

// PARTIALS

function parseHTML(content, xmlns) {
	const template = xmlns
		? createElementNS(xmlns, 'template')
		: createElement('template')

	template.innerHTML = content

	// xml
	let tlpContent = template.content
	if (!tlpContent) {
		const childNodes = template.childNodes
		if (childNodes.length === 1) {
			return template.firstChild
		}

		tlpContent = new DocumentFragment()
		tlpContent.append(...childNodes)
	}

	return tlpContent.childNodes.length === 1
		? tlpContent.firstChild
		: tlpContent
}

/**
 * @param {string} content
 * @param {{
 * 	x?: string
 * 	i?: boolean
 * 	m?: number
 * }} propsData
 */
export function createPartial(content, propsData = nothing) {
	let clone = () => {
		const node = withXMLNS(propsData.x, xmlns =>
			parseHTML(content, xmlns),
		)

		clone = propsData.i
			? importNode.bind(null, node, true)
			: node.cloneNode.bind(node, true)
		return clone()
	}

	return props =>
		markComponent(() => assignPartialProps(clone(), props, propsData))
}

function assignPartialProps(node, props, propsData) {
	if (props) {
		const nodes = walkElements(node, propsData.m)

		withXMLNS(propsData.x, xmlns => {
			for (let i = 0; i < props.length; i++) {
				assignProps(nodes[propsData[i] || i], props[i])
			}
		})
	}

	return node instanceof DocumentFragment
		? toArray(node.childNodes)
		: node
}

/**
 * Assigns props to an element and creates its children
 *
 * @template P
 * @param {Element} node
 * @param {P} props
 * @returns {Element} Element
 */
function createNode(node, props) {
	props && assignProps(node, props)

	return node
}

/**
 * Creates the children for a parent
 *
 * @param {Element} parent
 * @param {Children} child
 * @param {boolean} [relative]
 * @param {Text | undefined} [prev]
 */
function createChildren(
	parent,
	child,
	relative = false,
	prev = undefined,
) {
	switch (typeof child) {
		// string/number
		case 'string':
		case 'number': {
			if (prev instanceof Text) {
				prev.nodeValue = child
				return prev
			}

			/**
			 * The text node could be created by just doing
			 * `parent.textContent = value` when the parent node has no
			 * children.
			 */
			if (!relative && parent.childNodes.length === 0) {
				parent.textContent = child
				return parent.firstChild
			}

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
			parent = createPlaceholder(parent, relative)

			// For - TODO move this to the `For` component
			$isMap in child
				? effect(() => {
						node = toDiff(
							node,
							child(child => {
								/**
								 * Wrap the item with placeholders, for when stuff in
								 * between moves. If a `Show` adds and removes nodes,
								 * we dont have a reference to these nodes. By
								 * delimiting with a shore, we can just handle
								 * anything in between as a group.
								 */
								const begin = createPlaceholder(parent, true)
								const end = createPlaceholder(parent, true)
								return [begin, createChildren(end, child, true), end]
							}),
							true,
						)
					})
				: effect(() => {
						// maybe a signal (at least a function) so needs an effect
						node = toDiff(
							node,
							[createChildren(parent, child(), true, node[0])].flat(
								Infinity,
							),
							true,
						)
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
			return parent
		}

		case 'object': {
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

			// children/fragments
			if (isArray(child)) {
				return child.length === 1
					? createChildren(parent, child[0], relative)
					: child.map(child =>
							createChildren(parent, child, relative),
						)
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
					isConnected(parent) && setValue(result)

				resolved(child, onResult)

				return createChildren(parent, value, relative)
			}

			// iterable/Map/Set/NodeList
			if (iterator in child) {
				return createChildren(
					parent,
					toArray(/** @type Iterator */ child.values()),
					relative,
				)
				/**
				 * For some reason this breaks with a node list in the
				 * `Context` example of the `html` docs section.
				 *
				 *     return toArray(child.values(), child =>
				 *     	createChildren(parent, child, relative),
				 *     )
				 */
			}

			// CSSStyleSheet
			if (child instanceof CSSStyleSheet) {
				/**
				 * Custom elements wont report a document unless is already
				 * connected. So our stylesheet would end on the main document
				 * instead of the shadowRoot
				 */
				onFixes(() => {
					if (isConnected(parent)) {
						const doc = getDocumentForElement(parent)
						adoptedStyleSheetsAdd(doc, child)

						cleanup(() => adoptedStyleSheetsRemove(doc, child))
					}
				})

				return undefined
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
				createTextNode(/** @type object */ child.toString()),
				relative,
			)
		}
	}
}

propsPlugin(
	'children',
	(node, propName, propValue) => createChildren(node, propValue),
	false,
)

/**
 * Creates placeholder to keep nodes in position
 *
 * @param {Element} parent
 * @param {boolean} [relative]
 * @returns {Element}
 */
const createPlaceholder = (parent, relative) =>
	insertNode(parent, createTextNode(''), relative)

const head = document.head

/**
 * Adds the element to the document
 *
 * @param {Element} parent
 * @param {Element} node
 * @param {boolean} [relative]
 * @returns {Element}
 */

function insertNode(parent, node, relative) {
	// special case `head`
	if (parent === head) {
		const name = node.tagName

		// search for tags that should be unique
		let prev
		if (name === 'TITLE') {
			prev = querySelector(head, 'title')
		} else if (name === 'META') {
			prev =
				querySelector(
					head,
					'meta[name="' + node.getAttribute('name') + '"]',
				) ||
				querySelector(
					head,
					'meta[property="' + node.getAttribute('property') + '"]',
				)
		} else if (name === 'LINK' && node.rel === 'canonical') {
			prev = querySelector(head, 'link[rel="canonical"]')
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
 * WARNINGS Removal of the element on where you render/insert into,
 * wont cause disposal of what you render/insert.
 */

/**
 * Inserts children into a parent
 *
 * @param {any} children - Thing to render
 * @param {Element} [parent] - Mount point, defaults to document.body
 * @param {{ clear?: boolean; relative?: boolean }} [options] -
 *   Mounting options
 * @returns {() => void} Disposer
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
 * @param {Element} [parent] - Mount point, defaults to
 *   `document.body`
 * @param {{ clear?: boolean; relative?: boolean }} [options] -
 *   Mounting options
 */
export function insert(
	children,
	parent = document.body,
	options = nothing,
) {
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
 * Creates a context and returns a function to get or set the value
 *
 * @param {any} [defaultValue] - Default value for the context
 * @returns {Function & { Provider: ({ value }) => Children }}
 *   Context
 * @url https://pota.quack.uy/Reactivity/Context
 */
/* #__NO_SIDE_EFFECTS__ */ export function context(
	defaultValue = undefined,
) {
	/** @type {Function & { Provider: ({ value }) => Children }} */
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

/**
 * Removes from the DOM `prev` elements not found in `next`
 *
 * @param {Element[]} prev - Array with previous elements
 * @param {Element[]} next - Array with next elements
 * @returns {Element[]}
 */
function toDiff(prev = [], next = [], short = false) {
	// if theres something to remove
	if (prev.length) {
		const nextLength = next.length

		// fast clear
		if (
			short &&
			nextLength === 0 &&
			// + 1 because of the original placeholder
			prev.length + 1 === prev[0].parentNode.childNodes.length
		) {
			const parent = prev[0].parentNode
			// save the placeholder
			const lastChild = parent.lastChild
			parent.textContent = ''
			parent.appendChild(lastChild)
		} else {
			for (const item of prev) {
				if (item && (nextLength === 0 || !next.includes(item))) {
					item.remove()
				}
			}
		}
	}
	return next
}
