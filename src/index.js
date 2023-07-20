let root, renderEffect, effect, cleanup, signal, memo, untrack

// for being able to switch reactive libraries easily

export function setReactiveLibrary(o) {
	root = o.root
	renderEffect = o.renderEffect
	effect = o.effect
	cleanup = o.cleanup
	signal = o.signal
	memo = o.memo
	untrack = o.untrack
}

// constants

const $component = Symbol('component')

// while not needed these make the logic/code more readable

const assign = Object.assign
const entries = Object.entries

const isArray = Array.isArray
const isFunction = v => typeof v === 'function'
const isComponentFunction = v => v && v[$component] === ComponentFunction
const isComponentNode = v => v && v[$component] === ComponentNode
const isComponentFragment = v => v && v.displayName === 'createFragment'
const isComponent = v =>
	isComponentNode(v) || isComponentFunction(v) || isComponentFragment(v)
const isNode = v => v && v.nodeType // v instanceof Node
const isDisplayable = v => {
	const type = typeof v
	return (
		type === 'string' ||
		type === 'number' ||
		type === 'boolean' ||
		v === undefined ||
		type === 'bigint'
	)
}

const getValue = v => (isFunction(v) ? v() : v)
const call = (fns, ...args) => fns && fns.forEach(fn => fn(...args))

// todo: allow to change document
const createElement = document.createElement.bind(document)
const createElementNS = document.createElementNS.bind(document)
const createTextNode = document.createTextNode.bind(document)
const createComment = document.createComment.bind(document)

const NS = {
	svg: 'http://www.w3.org/2000/svg',
	math: 'http://www.w3.org/1998/Math/MathML',
	html: 'http://www.w3.org/1999/xhtml',
	xlink: 'http://www.w3.org/1999/xlink',
}
const NSProps = {
	'xlink:href': 'http://www.w3.org/1999/xlink',
}

// components

// <MyComponent ../>
function ComponentFunction(fn, props, children) {
	return untrack(() => fn(props, children))
}

// <div ../>
function ComponentNode(tagName, props, children, parent) {
	return untrack(() => createNode(tagName, props, children, parent))
}

// <>...</>
export function createFragment(props, children) {
	return children
}

// must return a function so we render from parent to children instead of from children to parent
// this allows to access parent from children
// having parent before children creation is helpful for example to create svgs and spread the namespace downwards

export function createComponent(unknown, props, ...children) {
	props = props || Object.create(null)

	const component = isFunction(unknown) ? ComponentFunction : ComponentNode

	const meta = {
		[$component]: component,
		displayName: component === ComponentNode ? unknown : unknown.name || 'anon function',
		unknown,
		props,
		children,
	}
	return assign(component.bind(meta, unknown, props, children), meta)
}

// rendering

export function render(unknown, parent) {
	return root(dispose => {
		insertChildren(parent, createComponent(unknown))
		return dispose
	})
}

// a x/html element
export function createNode(tag, props, children, parent) {
	// resolve the namespace
	const ns = props.xmlns
		? props.xmlns // the prop contains the namespace
		: // parent wont be defined if resolved by resolveChildren helper
		parent && parent.namespaceURI !== NS.html
		? parent.namespaceURI // the parent contains the namespace
		: NS[tag] // special case svg, math in case of missing xmlns attribute

	// todo handle real nodes coming in `tag`
	const node = ns ? createElementNS(ns, tag) : createElement(tag)

	// get rid of the node on cleanup
	cleanup(() => node.remove())

	// assign the props to the tag
	entries(props).forEach(([name, value]) => {
		assignProps(node, name, value)
	})

	// insert childrens
	// resolve in line the most common case of 1 children
	if (children.length)
		insertChildren(node, children.length === 1 ? children[0] : children)

	return node
}

// this function returns just to please the `For` component
// it NEEDS to return a valid dom node
function insertChildren(parent, child, placeholder) {
	// a placeholder helps to keep nodes in position

	function createPlaceholder(relative, text) {
		placeholder =
			!placeholder || !relative
				? parent.appendChild(createComment(text || ''))
				: // provided by parent
				  parent.insertBefore(createComment('by parent - ' + text || ''), placeholder)

		// get rid of the placeholder on cleanup
		cleanup(() => placeholder.remove())
	}

	if (isDisplayable(child)) {
		// undefined/string/number/boolean/bigint

		// create a text node
		const node = createTextNode(child)

		// insert node
		insertNode(parent, node, placeholder)

		return node
	}

	// TODO: on here maybe use flat, maybe not
	if (isArray(child)) {
		return child.map(child => insertChildren(parent, child, placeholder))
	}

	// TODO: on here maybe use flat, maybe not
	if (isComponentFragment(child)) {
		return child().map(child => insertChildren(parent, child, placeholder))
	}

	// DOM Node
	if (isNode(child)) {
		const node = child

		insertNode(parent, node, placeholder)

		// callbacks
		node.onCleanup && cleanup(() => call(node.onCleanup, node))
		call(node.onMount, node)

		return node
	}

	if (isComponentNode(child)) {
		return insertChildren(parent, child(parent), placeholder)
	}

	if (isComponentFunction(child)) {
		return insertChildren(parent, child(), placeholder)
	}

	// signal/memo/external/user provided function
	// CAREFUL moving function here up or down, its just checking for function
	if (isFunction(child)) {
		// needs placeholder to stay in position OK
		// needs `true` to stay in a relative position
		createPlaceholder(true, child.displayName || child.name)

		// maybe signal: needs an effect
		const node = renderEffect(() => insertChildren(parent, child(), placeholder))

		// if we return undefined it crash, need to return the placeholder
		// its important to return a placeholder here
		return node || placeholder
	}

	if (child === null) {
		// we are cheating here and not returning a placeholder
		return createTextNode('') // the value is null, as in {null}
	}

	if (child instanceof MapArray) {
		// needs `true` to stay in a relative position
		createPlaceholder(true, 'MapArray')

		// signal: needs an effect
		return renderEffect(() =>
			// `For`, the callback function will run only for new childs
			// parent is needed to resolve the childs, or maybe not TODO
			child.map(parent, child => insertChildren(parent, child, placeholder)),
		)
	}

	// object/symbol/catch all

	// create a text node
	// toString() is needed for symbols and other fancy objects
	const node = createTextNode(child.toString())

	// insert node
	insertNode(parent, node, placeholder)

	return node
}

function insertNode(parent, node, relativeTo) {
	relativeTo ? parent.insertBefore(node, relativeTo) : parent.appendChild(node)
	cleanup(() => node.remove())
}

// recursively resolve all children and return direct children

function resolve(children, parent) {
	if (isFunction(children)) {
		return resolve(children(parent), parent)
	}
	if (isArray(children)) {
		const childrens = []
		for (let child of children) {
			child = resolve(child, parent)
			isArray(child) ? childrens.push.apply(childrens, child) : childrens.push(child)
		}
		return childrens
	}
	return children
}

// helper for making untracked callbacks

function makeCallback(children) {
	if (children.length === 1) {
		const cb = children[0]
		if (isComponent(cb)) {
			return cb // already untracking
		}
		if (isFunction(cb)) {
			return markComponent(cb) // should untrack
		}
		return () => cb // simple value
	}
	return markComponent(() => children)
}

function markComponent(fn) {
	return assign((...args) => untrack(() => fn(...args)), {
		[$component]: ComponentFunction,
	})
}

// control flow

export function Show(props, children) {
	const callback = makeCallback(children)
	const condition = memo(() => getValue(props.when))
	return memo(() => {
		const result = condition()
		return result ? callback(result) : null
	})
}

// For

export function For(props, children) {
	const callback = makeCallback(children)
	return memo(() => new MapArray(props.each, callback))
}

// Map Array

class MapArray {
	constructor(items, cb) {
		this.mapper = mapArray(items, cb)
	}
	map(parent, fn) {
		// needs the children for sorting, so calling resolve
		let nodes = resolve(
			this.mapper((item, index) => fn(item)),
			parent,
		)

		// order of nodes may have changed, reorder it
		if (nodes.length > 1) {
			const parent = nodes[0].parentNode
			for (let i = nodes.length - 1; i > 0; i--) {
				const node = nodes[i]
				const prev = nodes[i - 1]
				if (node.previousSibling !== prev) {
					parent.insertBefore(prev, node)
				}
			}
		}
		return nodes
	}
}

function mapArray(list, cb) {
	const map = new Map()
	const byIndex = ' _ cached by index _ '

	let runId = 0
	let prev = []

	// to get rid of all nodes
	cleanup(() => {
		for (const row of map.values()) row.dispose()
	})

	// create an item
	function create(item, index, fn, byIndex) {
		// a root is created so we can call dispose to get rid of an item
		// TODO: maybe we can avoid the root here?
		return root(dispose => ({
			item,
			node: fn ? fn(cb(item, index), index) : cb(item, index),
			dispose: () => {
				dispose(), map.delete(item), byIndex && map.delete(index + byIndex)
			},
		}))
	}

	return function mapper(fn) {
		runId++

		const items = list() || []
		const rows = []

		for (const [index, item] of items.entries()) {
			let row = map.get(item)
			if (!row) {
				// if the item doesnt exists, create it
				row = create(item, index, fn)
				map.set(item, row)
			} else if (row.runId === runId) {
				// a map will save only 1 of any primitive duplicates, say: [1, 1, 1, 1]
				// if the saved value was already used on this run, create a new one
				// to avoid the previous problem, cache the value by index
				row = map.get(index + byIndex)
				if (!row || row.item !== item) {
					row = create(item, index, fn, 1)
					map.set(index + byIndex, row)
				}
			}
			// mark used on this run
			row.runId = runId
			rows.push(row)
		}

		// remove rows that arent present on the current list
		for (const row of prev) {
			if (row.runId !== runId) row.dispose()
		}

		// save list
		prev = rows

		// return external representation
		return rows.map(item => item.node)
	}
}

// naive assign props

function assignProps(node, name, value) {
	if (name === 'mount' || typeof value === 'symbol') {
		return
	}
	if (name === 'onMount') {
		node.onMount = node.onMount || []
		node.onMount.push(value)
		return
	}
	if (name === 'onCleanup') {
		node.onCleanup = node.onCleanup || []
		node.onCleanup.push(value)
		return
	}
	if (value === null) {
		NSProps[name]
			? node.removeAttributeNS(NSProps[name], name, value)
			: node.removeAttribute(name)
		return
	}
	if (name === 'style') {
		if (typeof value === 'string') {
			node.style.cssText = value
		} else {
			entries(value).forEach(([name, value]) => {
				// maybe here cache a reference to value and make it run only 1 effect for all copies of value
				effect(() => {
					node.style[name] = isFunction(value) ? value() : value
				})
			})
		}
		return
	}
	if (name.startsWith('on') && name.toLowerCase() in window) {
		node.addEventListener(name.toLowerCase().substr(2), value)
		return
	}

	NSProps[name]
		? node.setAttributeNS(NSProps[name], name, value)
		: node.setAttribute(name, value)
}
