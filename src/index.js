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

// while not needed these make the logic/code more readable

const assign = Object.assign
const entries = Object.entries

const isArray = Array.isArray
const isFunction = v => typeof v === 'function'
const isComponent = v => v && v[$component] === null
const isResolved = v => v && v[$resolved] === null

const getValue = v => (isFunction(v) ? v() : v)
const call = (fns, ...args) => fns && fns.forEach(fn => fn(...args))

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

const $component = Symbol('component')
const $resolved = Symbol('resolved')

// components

function Component(tag, props, children, name, parent) {
	// user defined component
	if (isFunction(tag)) {
		return untrack(() => tag(props, children))
	}

	// a html tag component
	return untrack(() => createNode(tag, props, children, name, parent))
}

export function createFragment(props, children) {
	return children
}

// must return a function so we render from parent to children instead of from children to parent
// this allows to access parent from children
// having parent before children creation is helpful for example to create svgs and spread the namespace downwards
export function createComponent(tag, props, ...children) {
	props = props || Object.create(null)
	const name = tag.name !== undefined ? tag.name : tag

	return assign(Component.bind(null, tag, props, children, name), {
		[$component]: null,
		componentName: name,
		tag,
		props,
		children,
	})
}

// rendering

export function render(children, parent) {
	return root(dispose => {
		insertChildren(parent, createComponent(children))
		return dispose
	})
}

// a x/html tag element
export function createNode(tag, props, children, name, parent) {
	// resolve the namespace
	const ns = props.xmlns
		? props.xmlns // the prop contains the namespace
		: // parent wont be defined if resolved by resolveChildren helper
		parent && parent.namespaceURI !== NS.html
		? parent.namespaceURI // the parent contains the namespace
		: NS[tag] // special case svg, math in case of missing xmlns attribute

	const node = ns ? createElementNS(ns, tag) : createElement(tag)

	// assign the props to the tag
	entries(props).forEach(([name, value]) => {
		assignProps(node, name, value)
	})

	// get rid of the node on cleanup
	cleanup(() => {
		console.log('deleting 1', node)
		node.remove()
	})

	// insert childrens
	if (children.length) {
		// resolve in line the most common case of 1 children
		insertChildren(node, children.length === 1 ? children[0] : children, null, name)
	}

	return node
}

function insertChildren(parent, child, placeholder, name) {
	// a placeholder helps to keep nodes in position
	// the placeholder is later replaced by the actual node

	placeholder = !placeholder
		? parent.appendChild(
				createComment(
					'parent doesnt provide placeholder - ' + name + ' - ' + typeof child,
				),
		  )
		: // in the case of arrays, position nodes relative to the component
		  parent.insertBefore(
				createComment('placeholder from parent - ' + name + ' - ' + typeof child),
				placeholder,
		  )

	cleanup(() => {
		placeholder.remove()
	})

	if (isArray(child)) {
		// TODO: on here maybe use flat, maybe not
		return child.map(child => insertChildren(parent, child, placeholder, name))
	}

	if (isComponent(child)) {
		return insertChildren(parent, child(parent), placeholder, name)
	}

	if (isFunction(child)) {
		effect(previous =>
			// function call child() doesnt need `parent`, its an external function/signal
			insertChildren(parent, child(), placeholder, name),
		)
		// TODO: this makes it so the reference will change when sorting the items
		return placeholder
	}

	if (child === null) {
		return placeholder // the value is null, as in {null}
	}

	if (child instanceof MapArray) {
		// `For`, the callback function will run only for new childs
		return child.map(parent, child => insertChildren(parent, child, placeholder, name))
	}

	// TODO: move this up

	// create a text node if isnt a node
	const node = child.nodeType ? child : createTextNode(child)
	markResolved(node)

	// put the node in place by replacing the placeholder or the old node
	placeholder.replaceWith(node)

	// save the new node as the new placeholder (to be replaced if the node changes)
	placeholder = node

	// callbacks
	if (child) {
		child.onCleanup && cleanup(() => call(child.onCleanup, node))
		call(child.onMount, node)
	}

	return node
}

// this needs to resolve for real all of them
function resolve(children, parent) {
	if (children === null) {
		return children // children is null as in {null}
	}
	if (isResolved(children)) {
		return children
	}
	if (isComponent(children)) {
		return children(parent)
	}
	if (isArray(children)) {
		// it flats what createNode returns not the full tree
		// so all of the direct children of a given 1 node
		return (
			children
				.flat(Infinity)
				// only resolve not resolved nodes
				.map(child => (isResolved(child) ? child : resolve(child, parent)))
				.flat(Infinity)
		) // resolve may put more arrays into it
	}
	return children
}

// helper for making untracked callbacks

function makeCallback(children) {
	if (children.length === 1 && isFunction(children[0])) {
		return markComponent(children[0])
	}
	return markComponent(() => children)
}

function markComponent(fn) {
	return assign((...args) => untrack(() => fn(...args)), {
		[$component]: true,
	})
}

function markResolved(node) {
	node[$resolved] = null
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
			// console.log(nodes, nodes[0].parentNode)
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

	return fn => {
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
