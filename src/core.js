// reactivity

let root,
	renderEffect,
	effect,
	cleanup,
	signal,
	memo,
	untrack,
	createContext,
	useContext

// for being able to switch reactive libraries

export function setReactiveLibrary(o) {
	root = o.root
	renderEffect = o.renderEffect
	effect = o.effect
	cleanup = o.cleanup
	signal = o.signal
	memo = o.memo
	untrack = o.untrack
	createContext = o.createContext
	useContext = o.useContext
}

// export reactivity

export {
	root,
	renderEffect,
	effect,
	cleanup,
	signal,
	memo,
	untrack,
	createContext,
	useContext,
}

// constants

const $component = Symbol('component')
const $properties = Symbol('properties')

// while not needed these make the logic/code more concise/readable

const assign = Object.assign
const entries = Object.entries

const isArray = Array.isArray
export const isFunction = v => typeof v === 'function'
const isComponent = v =>
	typeof v === 'function' && v[$component] === true
const isDisplayable = v => {
	const type = typeof v
	return (
		type === 'string' ||
		type === 'number' ||
		type === 'boolean' ||
		type === 'bigint' ||
		// show undefined because most likely is a mistake by the developer
		v === undefined
	)
}

export const getValue = v => (isFunction(v) ? v() : v)
export const hasValue = v => v !== null && v !== undefined

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

// components

// <>...</>
export function Fragment() {}

// must return a function so we render from parent to children instead of from children to parent
// this allows to access parent from children
// having parent before children creation is helpful for example to create svgs and spread the namespace downwards

export function Component(value, props, ...children) {
	// special case fragments, these are arrays and dont need untrack nor props
	if (value === Fragment) {
		return children // <>...</>
	}

	// save the children
	// 1. use the `children` helper only if you need to access the html
	// 2. if you dont need the html then just use props.children as much as you want
	// 3. no need to call the functions inside props.children, just pass them down even in jsx

	// <div {...props}/> // has to check for props.children first to allow spreads
	// props.children = props.children || children

	if (!props) {
		// maybe consider to change for {children}
		props = Object.create(null)
		props.children = children
	} else if (!('children' in props)) {
		// only set `children` if the props dont have it already
		// use `in` to not trigger getters
		// also, if the prop children is _only_ a getter, we cant set it.
		props.children = children
	}

	// resolve component kind

	if (typeof value === 'string') {
		// a string component 'div' becomes <div>
		return factoryTag(value, props)
	} else if (isFunction(value)) {
		// a function component <MyComponent../>
		return factoryComponent(value, props)
	} else if (value instanceof Node) {
		// an actual node component <div>
		return factoryNode(value, props)
	} else {
		// objects with custom .toString()
		return factoryComponent(value, props)
	}
}

function factoryTag(tagName, props) {
	// component properties

	const properties = {
		component: createTag,
		value: tagName,
		get displayName() {
			return this.value
		},
		props,
	}

	// component instance

	const self = assign(function () {
		return untrack(() =>
			self.component(
				self.value,
				self.props,
				self.props.children,
				self,
			),
		)
	}, properties)

	return markComponent(self)
}

function factoryNode(node, props) {
	// component properties

	const properties = {
		component: createNode,
		value: node,
		get displayName() {
			return this.value.tagName
		},
		props,
	}

	// component instance

	const self = assign(function () {
		return untrack(() =>
			self.component(
				self.value,
				self.props,
				self.props.children,
				self,
			),
		)
	}, properties)

	return markComponent(self)
}

function factoryComponent(fn, props) {
	// component properties

	const properties = {
		component: fn,
		value: fn,
		get displayName() {
			return this.value.name || 'anon fn'
		},
		props,
	}

	// component instance

	const self = assign(function () {
		return untrack(() =>
			self.component(self.props, self.props.children, self),
		)
	}, properties)

	return markComponent(self)
}

// for being able to differentiate a signal function from a component function
// signals and user functions go in effects, components are untracked to avoid re-rendering

export function markComponent(fn) {
	return assign(fn, {
		[$component]: true,
	})
}

// keep track of parentNode for `xmlns` spreading to children

let parentNode

// creates a x/html element from a tagName

function createTag(tagName, props, children, self) {
	// resolve the namespace
	const ns = props.xmlns
		? props.xmlns // the prop contains the namespace
		: parentNode && parentNode.namespaceURI !== NS.html
		? parentNode.namespaceURI // the parent contains the namespace
		: NS[tagName] // special case svg, math in case of missing xmlns attribute

	return createNode(
		ns ? createElementNS(ns, tagName) : createElement(tagName),
		props,
		children,
		self,
	)
}

function createNode(node, props, children, self) {
	// keep track of parent nodes
	const oldParentNode = parentNode
	parentNode = node

	// set properties to the node for debugging
	// todo this also sets the mount point, figure out if that's the way
	node[$properties] = self
	if (parentNode[$properties]) {
		node[$properties].parent = parentNode[$properties]
	}

	// get rid of the node on cleanup
	cleanup(() => node.remove())

	// assign the props to the tag
	assignProps(node, props)

	// insert childrens
	// in line the most common case of 1 children, or no children at all
	if (children.length) {
		insertChildren(
			node,
			children.length === 1 ? children[0] : children,
		)
	}

	// restore parent node
	parentNode = oldParentNode

	return node
}

// a placeholder helps to keep nodes in position

function createPlaceholder(parent, placeholder, text, relative) {
	placeholder =
		!placeholder || !relative
			? parent.appendChild(createComment(text || ''))
			: // provided by parent
			  parent.insertBefore(
					createComment('by parent - ' + text || ''),
					placeholder,
			  )

	// get rid of the placeholder on cleanup
	cleanup(() => placeholder.remove())

	return placeholder
}

// this function returns just to please the `For` component
// it NEEDS to return a valid dom node
function insertChildren(parent, child, placeholder) {
	// string/number/undefined/boolean/bigint
	if (isDisplayable(child)) {
		// create a text node
		const node = createTextNode(child)

		// insert node
		insertNode(parent, node, placeholder)

		return node
	}

	if (isArray(child)) {
		return child.map(child =>
			insertChildren(parent, child, placeholder),
		)
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
		return insertChildren(parent, child(), placeholder)
	}

	// signal/memo/external/user provided function
	// CAREFUL moving this up or down, its just checking for function
	if (isFunction(child)) {
		// needs placeholder to stay in position
		// needs `true` to stay in a relative position
		placeholder = createPlaceholder(
			parent,
			placeholder,
			child.name,
			true,
		)

		// maybe signal so needs an effect
		// if we return undefined it crash, needs to return an actual node
		let node
		renderEffect(() => {
			node = insertChildren(parent, child(), placeholder)
			return node
		})
		return node
	}

	// the value is null, as in {null}
	if (child === null) {
		placeholder = createPlaceholder(
			parent,
			placeholder,
			'{null}',
			false,
		)
		return placeholder
	}

	if (child instanceof MapArray) {
		// needs `true` to stay in a relative position
		placeholder = createPlaceholder(
			parent,
			placeholder,
			'MapArray',
			true,
		)

		// signal: needs an effect
		let node
		renderEffect(() => {
			node = child.map(child =>
				insertChildren(parent, child, placeholder),
			)
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
	// check if the node has been portaled
	parent = node[$properties]?.props.mount || parent

	// special case head
	if (parent === document.head) {
		// search for tags that should be unique

		const head = document.head
		const name = node.tagName

		let prev
		if (name === 'META') {
			prev =
				head.querySelector('meta[name="' + node.name + '"]') ||
				head.querySelector('meta[property="' + node.property + '"]')
		} else if (name === 'TITLE') {
			prev = head.querySelector('TITLE')
		}

		if (prev) {
			// replace node
			prev.replaceWith(node)

			// restore old node on cleanup
			cleanup(() => {
				// it needs appendChild instead of replaceWith here because
				// our node gets cleaned up by the reactivity
				head.appendChild(prev)
			})
		} else {
			head.appendChild(node)
		}
	} else {
		relativeTo
			? parent.insertBefore(node, relativeTo)
			: parent.appendChild(node)
		cleanup(() => node.remove())
	}
}

// children helper for when you need the HTML
// if you do not need the html do not use this
// children helper is asumed to be used, therefore no lazy memo
export function children(fn) {
	const children = memo(fn)
	return memo(() => resolve(children()))
}

// rendering

export function render(value, parent, clean) {
	return root(dispose => {
		// default to document body
		const container = parent || document.body

		if (clean) container.textContent = ''

		// create component so its untracked
		insertChildren(container, Component(value))
		return dispose
	})
}

// recursively resolve all children and return direct children

export function resolve(children) {
	if (isFunction(children)) {
		return resolve(children())
	}
	if (isArray(children)) {
		const childrens = []
		for (let child of children) {
			child = resolve(child)
			isArray(child)
				? childrens.push.apply(childrens, child)
				: childrens.push(child)
		}
		return childrens
	}
	return children
}

// helper for making untracked callbacks from childrens

export function componentCallback(fns) {
	// function MyComponent() { return 'Something'} // children wont be an array
	// this happens on components created on the fly <Dynamic component={MyComponent}../>
	fns = isArray(fns) ? fns : [fns]
	return markComponent((...args) =>
		untrack(() => fns.map(fn => (isFunction(fn) ? fn(...args) : fn))),
	)
}

// lazy memo runs only after use, by fabio@solid-js/discord

export function lazyMemo(fn) {
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

// Map Array

export class MapArray {
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
	// when caching by value is not possible [1,2,1]
	// append this to each index to avoid a colision with the values
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
				dispose(),
					map.delete(item),
					byIndex && map.delete(index + byIndex)
			},
		}))
	}

	return function mapper(fn) {
		runId++

		const items = getValue(list) || []
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

function assignProps(node, props) {
	for (const [name, value] of entries(props)) {
		if (name === 'mount' || name === 'children') {
			continue
		}

		// namespace

		const [ns, localName] =
			name.indexOf(':') !== -1 ? name.split(':') : [undefined, name]

		// magic

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
			ns && NS[ns]
				? node.removeAttributeNS(NS[ns], name)
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

		ns && NS[ns]
			? node.setAttributeNS(NS[ns], name, value)
			: node.setAttribute(name, value)
	}
}