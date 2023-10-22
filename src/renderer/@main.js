// REACTIVITE PRIMITIVES

import {
	root,
	renderEffect,
	cleanup,
	untrack,
	signal,
} from '#primitives'

// CONSTANTS

import { $map, $meta, NS } from '#constants'

// LIB

import {
	empty,
	isArray,
	call,
	toArray,
	contextSimple,
	property,
} from '#std'

// RENDERER LIB

import {
	isClassComponent,
	isComponent,
	isComponentable,
	markComponent,
} from '#comp'

// PROPERTIES / ATTRIBUTES

import { assignProps } from './props/@main.js'
import { onFinally, onReady } from './scheduler.js'

// DOCUMENT

const createElement = document.createElement.bind(document)
const createElementNS = document.createElementNS.bind(document)
const createElementText = document.createTextNode.bind(document)

// COMPONENTS

/**
 * Used by the JSX transform, as <>...</> or <Fragment>...</Fragment>.
 * This function is empty because its given to `Component` via the
 * transformer and we dont even need to run it
 */
export const Fragment = () => {}

/**
 * Used by the JSX transform. `Component` is not supposed to be used
 * in user land. Returns a function because we need to render from
 * parent to children instead of from children to parent. This allows
 * to properly set the reactivity tree (think of nested effects that
 * clear inner effects). Additionally, this reversed flow allows to
 * access parent when creating children
 *
 * @param {string | Function | Element | object} value - Component
 * @param {object} props Object
 * @param {unknown} props.children Children
 */

export function Component(value, props) {
	// special case fragments, these are arrays and dont need untrack nor props
	if (value === Fragment) {
		return props.children
	}

	// The scope/context is used to hold the parent to be able to tell if dynamic children are XML
	const scope = Scope()

	/*
		As is already a component, just call it with props.

		Solves:
		const some = create('div')
 		some === () => createDiv
 		some !== Factory(some)

		The factory wont recognize `some` as an already seen component
		because we are returning a new function.
		By checking if its already a component we avoid this problem
	*/
	if (isComponent(value)) {
		return markComponent(() => value(props, scope))
	}

	// create component instance with props, and a scope/context initially set to an empty object
	return markComponent(() => Factory(value)(props, scope))
}

function Scope() {
	return {
		namespaceURI: undefined,
		parent: undefined,
	}
}
/**
 * Creates a component that can be used as `Comp(props)`
 *
 * @param {pota.Componenteable} value
 * @returns {pota.Component} Component
 */
export function create(value) {
	// check if the value is already a known component think of
	// `const MyComponent = create('div')
	// <Dynamic component={MyComponent}../> // which does create(props.component)
	if (isComponent(value)) {
		return value
	}

	return markComponent(Factory(value))
}

export const Components = new Map()

onFinally(() => Components.clear())

/**
 * Creates a component which is an untracked function that could be
 * called with a props object
 *
 * @param {pota.Componenteable} value
 * @returns {pota.Component}
 */

function Factory(value) {
	let component = Components.get(value)
	if (component) {
		return component
	}

	switch (typeof value) {
		case 'string': {
			// a string component, 'div' becomes <div>
			component = (props = empty(), scope = Scope()) =>
				untrack(() => createTag(value, props, scope))
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
			// a function component <MyComponent../>
			component = (props = empty(), scope = Scope()) =>
				untrack(() => value(props, scope))
			break
		}
		default: {
			if (value instanceof Node) {
				// an actual node component <div>
				component = (props = empty(), scope = Scope()) =>
					untrack(() =>
						createNode(value.cloneNode(true), props, scope),
					)
				break
			}

			// objects with a custom `.toString(props)`
			if ('toString' in value && value.toString.length > 0) {
				component = (props = empty()) =>
					untrack(() => value.toString(props))
				break
			}

			component = () => value

			break
		}
	}

	// save in cache
	Components.set(value, component)

	return component
}

// keeps track of parentNode for `xmlns` spreading to children
// defaults to empty object so parentNode.namespaceURI doesnt throw

const useParentNode = contextSimple(empty())

/**
 * Creates a x/html element from a tagName
 *
 * @param {string} tagName
 * @param {pota.Props} props
 * @param {pota.Props} scope
 * @returns {pota.Element} Element
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
 * @param {pota.Element} node
 * @param {pota.Props} props
 * @param {pota.Props} scope
 * @returns {pota.Element} Element
 */
function createNode(node, props, scope) {
	// sets internals properties of the node
	// allows to lookup mount, parent node for xmlns, holds events handlers
	// appears in the dev tools at the node properties for easy debugging

	// assign the scope to the node
	node[$meta] = scope

	if (node.namespaceURI !== NS.html) {
		scope.namespaceURI = node.namespaceURI
	}

	const parentNode = useParentNode()

	// on first run this will hold a value
	// once reactivity takes over (like a Show), then,
	// it wont and we use the old reference to the parent
	// which is already saved on the scope from the previous run
	if (parentNode[$meta]) {
		scope.parent = parentNode[$meta]
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
		node.isConnected && node.remove()
	})

	// assign the props to the node
	assignProps(node, props)

	// insert children
	// children will be `undefined` when there are no children at all, example `<br/>`
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
 * @param {pota.Element} parent
 * @param {pota.Children} child
 * @param {boolean} [relative]
 * @returns {pota.Children}
 */
function createChildren(parent, child, relative) {
	switch (typeof child) {
		// string/number/undefined
		// display `undefined` because most likely is a mistake
		// in the data/by the developer
		// the only place where `undefined` is unwanted and discarded
		// is on values of styles/classes/node attributes/node properties
		case 'string':
		case 'number':
		case 'undefined': {
			return insertNode(parent, createElementText(child), relative)
		}

		case 'function': {
			// component
			if (isComponent(child)) {
				return createChildren(parent, child(), relative)
			}

			// signal/memo/external/user provided function
			// needs placeholder to stay in position
			parent = createPlaceholder(parent, child.name, relative)

			// maybe a signal so needs an effect
			let node
			renderEffect(() => {
				node = createChildren(parent, child(), true)
				return node
			})
			// A placeholder is created and added to the document but doesnt form part of the children.
			// The placeholder needs to be returned so it forms part of the group of children
			// If children are moved and the placeholder is not moved with them, then,
			// whenever children update these will be at the wrong place.
			// wrong place: where the placeholder is and not where the children were moved to
			return [node, parent]
		}

		case 'object': {
			// children/fragments/NodeList
			if (isArray(child)) {
				return child.map(child =>
					createChildren(parent, child, relative),
				)
			}

			// Node
			if (child instanceof Node) {
				return insertNode(parent, child, relative)
			}

			// the value is `null`, as in {null} or like a show returning `null` on the falsy case
			if (child === null) {
				return null
			}

			// For
			if (child[$map] === null) {
				// signal: needs an effect

				let node
				renderEffect(() => {
					node = child.map(child => {
						// wrap the item with placeholders, to avoid resolving and for easy re-arrangement
						const begin = createPlaceholder(parent, 'begin', true)
						const end = createPlaceholder(parent, 'end', true)

						return [begin, createChildren(end, child, true), end]
					})
					return node
				})
				return node
			}

			// async components
			if (child.then) {
				const [component, setComponent] = signal('')
				child.then(r => parent.isConnected && setComponent(r))
				return createChildren(parent, component, relative)
			}

			// iterable
			if (child instanceof Map || child instanceof Set) {
				return toArray(child.values()).map(child =>
					createChildren(parent, child, relative),
				)
			}

			// object.toString fancy objects
			return createChildren(parent, child.toString(), relative)
		}

		default: {
			// the very unlikely
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
 * @param {pota.Element} parent
 * @param {unknown} text
 * @param {boolean} [relative]
 * @returns {pota.Element}
 */
function createPlaceholder(parent, text, relative) {
	/*
	return insertNode(
		parent,
		document.createComment(
			(text || '') + (relative ? ' relative' : ''),
		),
		relative,
	)
	*/
	return insertNode(parent, createElementText(''), relative)
}

/**
 * Adds the element to the document
 *
 * @param {pota.Element} parent
 * @param {pota.Element} node
 * @param {boolean} [relative]
 * @returns {pota.Element}
 */
function insertNode(parent, node, relative) {
	// special case `head`
	if (parent === document.head) {
		const head = document.head
		const name = node.tagName

		// search for tags that should be unique
		let prev
		if (name === 'META') {
			prev =
				head.querySelector('meta[name="' + node.name + '"]') ||
				head.querySelector('meta[property="' + node.property + '"]')
		} else if (name === 'TITLE') {
			prev = head.querySelector('title')
		}

		// replace old node if there's any
		prev ? prev.replaceWith(node) : head.appendChild(node)
	} else {
		relative ? parent.before(node) : parent.appendChild(node)
	}

	// get rid of children nodes on cleanup
	cleanup(() => {
		node.isConnected && node.remove()
	})

	return node
}

// RENDERING

/**
 * @param {any} value - Thing to render
 * @param {pota.Element | null | undefined} [parent] - Mount point,
 *   defaults to document.body
 * @param {{ clear?: boolean; relative?: boolean }} [options] -
 *   Mounting options
 * @returns {Function} Disposer
 */
export function render(value, parent, options = empty()) {
	const dispose = root(dispose => {
		// run dispose when the mount point is removed from the document
		// assumes that parent was created by this lib
		parent && property(parent, 'onUnmount', []).push(dispose)

		insert(value, parent, options)
		return dispose
	})
	// run dispose when the parent scope disposes
	// todo: should do this only when its owned
	cleanup(dispose)
	return dispose
}

/**
 * @param {any} value - Thing to render
 * @param {pota.Element | null | undefined} [parent] - Mount point,
 *   defaults to document.body
 * @param {{ clear?: boolean; relative?: boolean }} [options] -
 *   Mounting options
 */
export function insert(value, parent, options = empty()) {
	options.clear && clearNode(parent)

	return createChildren(
		parent || document.body,
		isComponentable(value) ? create(value) : value,
		options.relative,
	)
}

/** @param {pota.Element} node */
function clearNode(node) {
	// check for node existence to be able to use querySelector on yet to be created nodes
	node.textContent = ''
}

// templates are cached for the duration of a run
// cache is cleared after the run
// if you make a list with 100 links, it will reuse a component 99 times
// then discard that object
// performance opportunity: expiration could be smarter

/**
 * Creates tagged template components
 *
 * @param {TemplateStringsArray} template
 * @param {...any} values
 * @returns {pota.Children}
 */
export function template(template, ...values) {
	let cached = Components.get(template)
	if (!cached) {
		cached = createElement('pota')
		cached.innerHTML = template.join('<pota></pota>')
		Components.set(template, cached)
	}

	const clone = cached.cloneNode(true)

	// it searches all nodes with our attribute wildcard OR nodes with our name
	const replace = document.evaluate(
		"//*[@*='<pota></pota>']|//pota",
		clone,
		null,
		XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
		null,
	)

	// as we are going to manipulate the nodes
	// the snapshot will change and will get messed up
	// save it on a temp array
	/** @type {Element[]} */
	const nodes = []
	for (let i = 0; i < replace.snapshotLength; i++) {
		nodes.push(replace.snapshotItem(i))
	}
	let index = 0

	const insertOptions = { relative: true }

	for (const node of nodes) {
		if (node.localName === 'pota') {
			// replace full node

			const value = values[index++]
			insert(
				// `insert` creates components for things to insert.
				// for nodes it will use `cloneNode`
				// this will cause any event listener to be lost
				// for this reason we wrap it on a function
				value instanceof Node ? markComponent(() => value) : value,
				node,
				insertOptions,
			)
			node && node.remove()
		} else {
			// replace attribute

			// as we are going to manipulate the attributes
			// these will change and will get messed up
			// save it on a temp array
			const attributes = toArray(node.attributes).filter(
				item => item.value === '<pota></pota>',
			)
			for (const attr of attributes) {
				node.removeAttribute(attr.name)
				node[attr.name] = values[index++]
			}
		}
	}

	// return a single element if possible to make it more easy to use
	return clone.childNodes.length === 1
		? clone.childNodes[0]
		: [...clone.childNodes] // from NodeList to Array
}

/**
 * Defines a custom Element (if isnt defined already), and returns a
 * `Component` of it that can be used as `myComponent(props)`
 *
 * @param {string} name - Name for the custom element
 * @param {CustomElementConstructor} constructor - Class for the
 *   custom element
 * @param {ElementDefinitionOptions} [options] - Options passed to
 *   `customElements.define`
 * @returns {pota.Component}
 */
export function customElement(name, constructor, options) {
	if (customElements.get(name) === undefined) {
		customElements.define(name, constructor, options)
	}
	return create(name)
}
