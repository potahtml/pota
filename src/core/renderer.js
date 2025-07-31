// CONSTANTS

import { $isComponent, $isMap, NS } from '../constants.js'

// LIB

import {
	unwrapArray,
	freeze,
	isArray,
	iterator,
	nothing,
	resolved,
	stringify,
	toArray,
	flatToArray,
	toValues,
	isFunction,
} from '../lib/std.js'

import {
	createElement,
	createElementNS,
	createTextNode,
	document,
	DocumentFragment,
	getDocumentForElement,
	head,
	importNode,
	isConnected,
	querySelector,
	walkElements,
} from '../use/dom.js'

import {
	addAdoptedStyleSheet,
	removeAdoptedStyleSheet,
} from '../use/css.js'

// REACTIVE

import {
	cleanup,
	Context,
	effect,
	root,
	signal,
	untrack,
	markComponent,
} from '../lib/reactive.js'

import { onFixes } from './scheduler.js'

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
 * @template T
 * @param {string | Function | Element | object | symbol} value -
 *   Component
 * @param {Props<T>} [props] - Props object
 * @returns {(props: Partial<Props<T>>) => Children}
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
 * @param {string | Function | Element | object | symbol} value -
 *   Component value
 * @returns {(props?: Props<T>) => Children}
 */
function Factory(value) {
	switch (typeof value) {
		case 'string': {
			// string component, 'div' becomes <div>
			return markComponent(props => createTag(value, props))
		}
		case 'function': {
			return $isComponent in value ? value : markComponent(value)
		}
		default: {
			if (value instanceof Element) {
				// node component <div>
				return markComponent(props => createNode(value, props))
			}

			// creates anything
			return markComponent(() => value)
		}
	}
}

/**
 * Creates a x/html element from a tagName
 *
 * @template {Props<{ xmlns?: string; is?: string }>} P
 * @param {string} tagName
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
					? createElementNS(xmlns, tagName, { is: props?.is })
					: createElement(tagName, { is: props?.is }),
				props,
			),
		tagName,
	)
}

let usedXML

/**
 * @param {string} xmlns
 * @param {(xmlns: string) => Element} fn
 * @param {string} [tagName]
 * @returns {Element}
 */
function withXMLNS(xmlns, fn, tagName) {
	if (!usedXML) {
		if (!xmlns) {
			return fn(xmlns)
		}
		usedXML = true
	}

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

function parseXML(content, xmlns) {
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

/** Used in transform in place of jsxs */
export function createComponent(value) {
	const component = Factory(value)

	return props => {
		/** Freeze props so isnt directly writable */
		freeze(props)
		return markComponent(() => component(props))
	}
}

/**
 * @template T
 * @param {string} content
 * @param {{
 * 	x?: string
 * 	i?: number
 * 	m?: number
 * } & Record<string, unknown>} [propsData]
 * @returns {(props: T extends any[]) => Children}
 */
export function createPartial(content, propsData = nothing) {
	let clone = () => {
		const node = withXMLNS(propsData.x, xmlns =>
			parseXML(content, xmlns),
		)

		clone = propsData.i
			? importNode.bind(null, node, true)
			: node.cloneNode.bind(node, true)
		return clone()
	}

	return props =>
		markComponent(() => assignPartialProps(clone(), props, propsData))
}

/**
 * @template T
 * @param {Element} node
 * @param {T[]} props
 * @param {{
 * 	x?: string
 * 	[i: number]: number
 * 	m?: number
 * } & Record<string, unknown>} propsData
 * @returns {Children}
 */
function assignPartialProps(node, props, propsData) {
	if (props) {
		const nodes = walkElements(node, propsData.m)

		withXMLNS(propsData.x, xmlns => {
			for (let i = 0; i < props.length; i++) {
				props[i](nodes[i in propsData ? propsData[i] : i])
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
 * @template T
 * @param {Element} node - Element to assign props to
 * @param {Props<T>} props - Props to assign
 * @returns {Element} The element with props assigned
 */
function createNode(node, props) {
	props && assignProps(node, props)

	return node
}

/**
 * Creates the children for a parent
 *
 * @param {Element | DocumentFragment} parent
 * @param {Children} child
 * @param {boolean} [relative]
 * @param {Text | undefined} [prev]
 * @returns {Children}
 */
export function createChildren(
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
			if ($isComponent in child) {
				return createChildren(
					parent,
					untrack(/** @type {() => Children} */ (child)),
					relative,
				)
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
							flatToArray(
								child(child => createChildren(parent, child, true)),
							),
							true,
						)
					})
				: effect(() => {
						// maybe a signal (at least a function) so needs an effect
						node = toDiff(
							node,
							flatToArray(
								createChildren(parent, child(), true, node[0]),
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
				/**
				 * For some reason this breaks with a node list in the
				 * `Context` example of the `html` docs section.
				 *
				 *     return toArray(child.values(), child =>
				 *     	createChildren(parent, child, relative),
				 *     )
				 */
				return createChildren(parent, toValues(child), relative)
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
						addAdoptedStyleSheet(doc, child)

						cleanup(() => removeAdoptedStyleSheet(doc, child))
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
	(node, propName, propValue) => {
		createChildren(node, propValue)
	},
	false,
)

/**
 * Creates placeholder to keep nodes in position
 *
 * @param {Element | DocumentFragment} parent
 * @param {boolean} [relative]
 * @returns {Element} The placeholder element
 */
const createPlaceholder = (parent, relative) =>
	insertNode(parent, createTextNode(''), relative)

/**
 * Adds the element to the document
 *
 * @param {Element | DocumentFragment} parent
 * @param {Element} node
 * @param {boolean} [relative]
 * @returns {Element} The inserted node
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
		relative
			? parent.parentNode.insertBefore(node, parent)
			: parent.appendChild(node)
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
 * @param {Element | null} [parent] - Mount point, defaults to
 *   document.body
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
 * @param {Element | null} [parent] - Mount point, defaults to
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
		Factory(isFunction(children) ? children : () => children),
		options.relative,
	)

	// @ts-ignore
	cleanup(() => toDiff(flatToArray(node)))

	return node
}

/**
 * Creates and returns HTML Elements for `children`
 *
 * @param {Children} children
 * @returns {Children}
 * @url https://pota.quack.uy/toHTML
 */
export function toHTML(children) {
	/**
	 * DocumentFragment is transformed to an `Array` of `Node/Element`,
	 * that way we can keep a reference to the nodes. Because when the
	 * DocumentFragment is used, it removes the nodes from the
	 * DocumentFragment and then we will lose the reference.
	 */

	return unwrapArray(toHTMLFragment(children).childNodes)
}

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
 * @template T
 * @param {T} [defaultValue] - Default value for the context
 * @url https://pota.quack.uy/Reactivity/Context
 */
/* #__NO_SIDE_EFFECTS__ */ export function context(
	defaultValue = undefined,
) {
	const ctx = Context(defaultValue)
	// @ts-ignore
	ctx.toHTML = toHTML

	return ctx
}

/**
 * Removes from the DOM `prev` elements not found in `next`
 *
 * @param {Element[]} [prev=[]] - Array with previous elements.
 *   Default is `[]`
 * @param {Element[]} [next=[]] - Array with next elements. Default is
 *   `[]`
 * @param {boolean} [short=false] - Whether to use fast clear. Default
 *   is `false`
 * @returns {Element[]} The next array of elements
 */
function toDiff(prev = [], next = [], short = false) {
	// if theres something to remove
	if (prev.length) {
		// fast clear
		if (
			short &&
			next.length === 0 &&
			// + 1 because of the original placeholder
			prev.length + 1 === prev[0].parentNode.childNodes.length
		) {
			const parent = prev[0].parentNode
			// save the placeholder
			const lastChild = parent.lastChild
			parent.textContent = ''
			parent.appendChild(lastChild)
		} else if (next.length === 0) {
			for (const item of prev) {
				item && item.remove()
			}
		} else {
			for (const item of prev) {
				if (item && !next.includes(item)) {
					item.remove()
				}
			}
		}
	}
	return next
}
