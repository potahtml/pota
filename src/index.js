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

const $mount = Symbol('mount')

// while not needed these make the logic/code more readable

const assign = Object.assign
const entries = Object.entries

const isArray = Array.isArray
const isFunction = v => typeof v === 'function'

const isComponent = v => v && v.super === Component
const isComponentTag = v => v && v.component === createTag
const isComponentNode = v => v && v.component === createNode
const isComponentFunction = v => v && v.component === Component

const isDisplayable = v => {
	const type = typeof v
	return (
		type === 'string' ||
		type === 'number' ||
		// show undefined because most likely is a mistake by the developer
		v === undefined ||
		type === 'boolean' ||
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

// <>...</>
export function Fragment(props, children) {
	return children
}

// must return a function so we render from parent to children instead of from children to parent
// this allows to access parent from children
// having parent before children creation is helpful for example to create svgs and spread the namespace downwards

export function Component(value, props, ...children) {
	// special case fragments, these dont need untrack nor props
	if (value === Fragment) {
		return children
	}

	// save the children
	// 1. use the `children` helper only if you need to access the html
	// 2. if you dont need the html then just use props.children as much as you want
	props = props || Object.create(null)
	props.children = children

	const component =
		typeof value === 'string'
			? createTag // a string component 'div'
			: value instanceof Node
			? createNode // an actual node component <div>
			: Component // a function component

	let self
	let properties = {
		value,
		props,
		get displayName() {
			return typeof this.value === 'string'
				? this.value
				: this.value instanceof Node
				? this.value.tagName
				: 'name' in this.value
				? this.value.name
				: this.value
		},
	}
	if (component === Component) {
		// a component function
		self = assign(function () {
			return untrack(() => self.value(self.props, self.props.children))
		}, properties)
	} else {
		self = assign(function (parent) {
			return untrack(() => component(self.value, self.props, self.props.children, parent))
		}, properties)
	}
	return markComponent(component, self)
}

// for being able to diferentiate from a signal function from a component function
// signals and user functions go in effects
function markComponent(constructor, fn) {
	return assign(fn, {
		component: constructor,
		super: Component,
	})
}

// children helper for when you need the HTML
// if you do not need the html do not use this

export function children(fn) {
	const children = lazy(fn)
	return lazy(() => resolve(children()))
}

// rendering

export function render(value, parent) {
	return root(dispose => {
		// create component so its untracked
		insertChildren(parent, Component(value))
		return dispose
	})
}

// creates a x/html element from a tagName

function createTag(tagName, props, children, parent) {
	// resolve the namespace
	const ns = props.xmlns
		? props.xmlns // the prop contains the namespace
		: // todo use some context
		parent?.node?.namespaceURI !== NS.html
		? parent?.node?.namespaceURI // the parent contains the namespace
		: NS[tagName] // special case svg, math in case of missing xmlns attribute

	return createNode(
		ns ? createElementNS(ns, tagName) : createElement(tagName),
		props,
		children,
		parent,
	)
}

function createNode(node, props, children, parent) {
	// get rid of the node on cleanup
	cleanup(() => node.remove())

	// assign the props to the tag
	assignProps(node, props)

	if (props.mount) {
		node[$mount] = props.mount
	}

	// insert childrens
	// resolve in line the most common case of 1 children, or no children at all
	if (children.length) {
		insertChildren(node, children.length === 1 ? children[0] : children)
	}

	return node
}

// this function returns just to please the `For` component
// it NEEDS to return a valid dom node
// function insertChildren(parent, child, placeholder) {}
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

	if (isArray(child)) {
		return child.map(child => insertChildren(parent, child, placeholder))
	}

	// DOM Node
	if (child instanceof Node) {
		const node = child

		insertNode(parent, node, placeholder)

		// callbacks
		node.onCleanup && cleanup(() => call(node.onCleanup, node))
		call(node.onMount, node)

		return node
	}

	if (isComponent(child)) {
		return insertChildren(parent, child(parent), placeholder)
	}

	// signal/memo/external/user provided function
	// CAREFUL moving this up or down, its just checking for function
	if (isFunction(child)) {
		// needs placeholder to stay in position OK
		// needs `true` to stay in a relative position
		createPlaceholder(true, child.name)

		// maybe signal so needs an effect

		// if we return undefined it crash, needs to return the placeholder
		// its important to return a placeholder here
		let node
		renderEffect(() => {
			node = insertChildren(parent, child(), placeholder)
			return node
		})
		return node
	}

	if (child === null) {
		createPlaceholder(false, '{null}')
		return placeholder // the value is null, as in {null}
	}

	if (child instanceof MapArray) {
		// needs `true` to stay in a relative position
		createPlaceholder(true, 'MapArray')

		// signal: needs an effect
		// `For`, the callback function will run only for new childs
		// parent is needed to resolve the childs, or maybe not TODO
		let node
		renderEffect(() => {
			node = child.map(child => insertChildren(parent, child, placeholder))
			return node
		})
		return node
	}

	// object/symbol/catch all

	// create a text node
	// toString() is needed for symbols and any fancy objects
	const node = createTextNode(child.toString())

	// insert node
	insertNode(parent, node, placeholder)

	return node
}

// insert

function insertNode(parent, node, relativeTo) {
	parent = node[$mount] || parent
	if (parent === document.head) {
		insertHeadNode(parent, node, relativeTo)
	} else {
		relativeTo ? parent.insertBefore(node, relativeTo) : parent.appendChild(node)
		cleanup(() => node.remove())
	}
}

// portal

function insertHeadNode(parent, node, relativeTo) {
	const head = document.head
	const name = node.localName // lowercase qualified node name
	// search for tags that should be unique
	let prev
	if (name === 'meta') {
		prev =
			head.querySelector('meta[name="' + node.name + '"]') ||
			head.querySelector('meta[property="' + node.property + '"]')
	} else if (name === 'title') {
		prev = head.querySelector('title')
	}

	if (prev) {
		// replace node
		prev.replaceWith(node)
		// restore node on cleanup
		cleanup(() => node.replaceWith(prev))
	} else {
		head.appendChild(node)
	}
}

// recursively resolve all children and return direct children

function resolve(children) {
	if (isFunction(children)) {
		return resolve(children())
	}
	if (isArray(children)) {
		const childrens = []
		for (let child of children) {
			child = resolve(child)
			isArray(child) ? childrens.push.apply(childrens, child) : childrens.push(child)
		}
		return childrens
	}
	return children
}

// helper for making untracked callbacks from childrens

export function makeCallback(fns) {
	return markComponent(Component, (...args) =>
		untrack(() => fns.map(fn => (isFunction(fn) ? fn(...args) : fn))),
	)
}

// lazy memo runs only after use

export default function lazy(fn) {
	const [sleeping, setSleeping] = signal(true)
	const m = memo(() => {
		if (sleeping()) return
		return fn()
	})
	return () => {
		setSleeping(false)
		return m()
	}
}

// control flow

export function Show(props, children) {
	const callback = makeCallback(children)
	const condition = memo(() => getValue(props.when))
	// needs resolve to avoid rerendering
	// `lazy` to not render it at all unless is needed
	const fallback = lazy(() => (props.fallback ? resolve(props.fallback) : null))
	return memo(() => {
		const result = condition()
		return result ? callback(result) : fallback()
	})
}

// For

export function For(props, children) {
	const callback = makeCallback(children)
	return memo(() => new MapArray(props.each, callback))
}

// portal

export function Portal(props, children) {
	return children.map(child => {
		child.props = { ...props, ...child.props }
		return child
	})
}

export function Dynamic(props) {
	const component = props.component
	delete props.component
	return Component(component, props)
}

// Map Array

class MapArray {
	constructor(items, cb) {
		this.mapper = mapArray(items, cb)
	}
	map(fn) {
		// needs the children for sorting, so calling resolve
		let nodes = resolve(this.mapper((item, index) => fn(item)))

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

function assignProps(node, props) {
	for (const [name, value] of entries(props)) {
		if (name === 'mount' || name === 'children' || typeof value === 'symbol') {
			continue
		}
		if (name === 'onMount') {
			node.onMount = node.onMount || []
			node.onMount.push(value)
			continue
		}
		if (name === 'onCleanup') {
			node.onCleanup = node.onCleanup || []
			node.onCleanup.push(value)
			continue
		}
		if (value === null) {
			NSProps[name]
				? node.removeAttributeNS(NSProps[name], name, value)
				: node.removeAttribute(name)
			continue
		}
		if (name === 'style') {
			if (typeof value === 'string') {
				node.style.cssText = value
			} else {
				entries(value).forEach(([name, value]) => {
					effect(() => {
						node.style[name] = getValue(value)
					})
				})
			}
			continue
		}
		if (name.startsWith('on') && name.toLowerCase() in window) {
			node.addEventListener(name.toLowerCase().substr(2), value)
			continue
		}

		NSProps[name]
			? node.setAttributeNS(NSProps[name], name, value)
			: node.setAttribute(name, value)
	}
}
