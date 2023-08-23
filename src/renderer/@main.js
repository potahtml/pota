// reactivity

let root,
	renderEffect,
	effect,
	cleanup,
	signal,
	memo,
	untrack,
	context,
	useContext,
	batch

// for being able to switch reactive libraries

export function setReactiveLibrary(o) {
	root = o.root
	renderEffect = o.renderEffect
	effect = o.effect
	cleanup = o.cleanup
	signal = o.signal
	memo = o.memo
	untrack = o.untrack
	context = o.context
	useContext = o.useContext
	batch = o.batch
}

// export the reactivity

export {
	root,
	renderEffect,
	effect,
	cleanup,
	cleanup as onCleanup,
	signal,
	memo,
	untrack,
	context,
	useContext,
	batch,
}

// constants

const $meta = Symbol('pota-meta')
const $component = Symbol('pota-component')

const NS = {
	svg: 'http://www.w3.org/2000/svg',
	math: 'http://www.w3.org/1998/Math/MathML',
	html: 'http://www.w3.org/1999/xhtml',
	xlink: 'http://www.w3.org/1999/xlink',
}

// to ensure timing of events callbacks are queued to run at specific times

const TIME_MOUNT = 1
const TIME_READY = 2

// while not needed these make the logic/code more concise/readable

const assign = Object.assign
const entries = Object.entries
const empty = () => Object.create(null)

export const isArray = Array.isArray
export const isFunction = value => typeof value === 'function'
export const isComponent = value =>
	typeof value === 'function' && value[$component] === null
const isComponentable = value =>
	typeof value === 'function' ||
	// avoid [1,2] and support { toString(){ return "something"} }
	(!isArray(value) && isNotNullObject(value))

// the following set of functions are based on the renderer assumptions
// these are not mean to be generic JavaScript functions
const isNotNullObject = value =>
	value !== null && typeof value === 'object'
export const hasValue = value => value !== null && value !== undefined
export const getValue = value =>
	typeof value === 'function' ? getValue(value()) : value

// runs arrays of functions with arguments
function call(fns, ...args) {
	fns.forEach(fn => {
		if (isArray(fn)) {
			fn[0](...args, ...fn.slice(1))
		} else {
			fn(...args)
		}
	})
}
function removeFromArray(arr, value) {
	const index = arr.indexOf(value)
	if (index !== -1) arr.splice(index, 1)
}

const createElement = document.createElement.bind(document)
const createElementNS = document.createElementNS.bind(document)
const createElementText = document.createTextNode.bind(document)
const createElementComment = document.createComment.bind(document)
const querySelector = document.querySelector.bind(document)

// Components

// <>...</>
// used by the JSX transform
// this function is empty because its given to `Component` via the transformer
// and we dont even need to run it
export const Fragment = () => {}

// used by the JSX transform
// `Component` is not supposed to be used in user land
// returns a function because we need to render from parent to children instead of from children to parent
// this allows to properly set the reactivity tree (think of nested effects that clear inner effects)
// additionally allows to access parent when creating children
export function Component(value, props, ...children) {
	// special case fragments, these are arrays and dont need untrack nor props
	if (value === Fragment) {
		// <>...</>
		return children
	}

	// props is `null` when the transformer finds no props: <div></div>
	// props is `undefined` when calling the Component function directly without props
	// `Component('div')`, whoever is doing this should be using `create('div')` instead
	// `Component('div')` returns a function with the props already set
	// `create('div')` returns a function that you can call with any props reusing the component
	if (!hasValue(props)) {
		// null or undefined
		props = assign(empty(), { children })
	} else if (props.children === undefined) {
		// only set `children` if the props dont have it already
		// when the `props.children` is set, it takes over the component own children:
		// <div children={[1,2,3]}>CHILDREN IS IGNORED HERE</div>
		props.children = children
	}

	// create component instance with bind, props, and a scope/context initially set to an empty object
	// the scope/context is used to hold the parent to be able to tell if dynamic childrens are XML
	return markComponent(Factory(value).bind(null, props, empty()))
}

// component are cached for the duration of a run (top to bottom)
// cache is cleared after the run
// if you make a list with 100 links in one shot
// it will reuse a component 99 times
// then discard that object
// performance opportunity: expiration could be smarter

const Components = new Map()

// the components factory
// abstraction for users
export function create(value) {
	// on here we check if the value is already a known component
	// think of
	// `const MyComponent = create('div'), AnotherComponent({children:create(MyComponent)({..props..})})`
	// the jsx transformer doesnt do that, but I can see how that could happen with user crafted components
	if (isComponent(value)) {
		return value
	}

	return markComponent(Factory(value))
}

// the components factory
// creates a component which is an untracked function that could be called with a props object
function Factory(value) {
	let component = Components.get(value)
	if (component) {
		return component
	}

	if (typeof value === 'string') {
		// a string component, 'div' becomes <div>
		component = (props = empty(), scope = empty()) =>
			untrack(() => createTag(value, props, props.children, scope))
	} else if (isFunction(value)) {
		// a function component <MyComponent../>
		component = (props = empty(), scope = empty()) =>
			untrack(() => value(props, props.children, scope))
	} else if (value instanceof Node) {
		// an actual node component <div>
		component = (props = empty(), scope = empty()) =>
			untrack(() =>
				createNode(
					value.cloneNode(true),
					props,
					props.children,
					scope,
				),
			)
	} else {
		// objects with a custom `.toString()`
		component = (props = empty(), scope = empty()) =>
			untrack(() => value.toString(props, props.children, scope))
	}

	// save in cache
	Components.set(value, component)

	return component
}

// allows to tell a `signal function` from a `component function`
// signals and user functions go in effects, for reactivity
// components and callbacks are untracked and wont go in effects to avoid re-rendering

function markComponent(fn) {
	fn[$component] = null
	return fn
}

// keeps track of parentNode for `xmlns` spreading to children
// defaults to empty object so parentNode.namespaceURI doesnt throw

let parentNode = empty()

// creates a x/html element from a tagName

function createTag(tagName, props, children, scope) {
	// get the namespace
	const ns = props.xmlns
		? props.xmlns // the prop contains the namespace
		: // this works on first run
		parentNode.namespaceURI && parentNode.namespaceURI !== NS.html
		? parentNode.namespaceURI // the parent contains the namespace
		: // used after the first run, once reactivity takes over
		scope.parent?.node.namespaceURI &&
		  scope.parent.node.namespaceURI !== NS.html
		? scope.parent.node.namespaceURI // the parent contains the namespace
		: NS[tagName] // special case svg, math in case of missing xmlns attribute

	return createNode(
		ns ? createElementNS(ns, tagName) : createElement(tagName),
		props,
		children,
		scope,
	)
}

function createNode(node, props, children, scope) {
	// sets internals properties of the node
	// allows to lookup mount, parent node for xmlns, holds events handlers
	// appears in the dev tools at the node properties for easy debugging

	scope.node = node
	scope.props = props

	// on first run this will hold a value
	// once reactivity takes over (like a Show), then,
	// it wont and we use old parent which is already saved on the scope from the previous run
	if (parentNode[$meta]) {
		scope.parent = parentNode[$meta]
	}

	// assign the scope to the node
	node[$meta] = scope

	// keep track of parent nodes
	const oldParentNode = parentNode
	parentNode = node

	// get rid of the node on cleanup
	cleanup(() => {
		// callbacks
		node[$meta].onCleanup &&
			untrack(() => call(node[$meta].onCleanup, node))
		// remove from the document
		node.remove()
	})

	// assign the props to the node
	assignProps(node, props)

	// insert childrens
	if (isArray(children)) {
		// in line the most common case of 1 children, or no children at all
		if (children.length)
			createChildren(
				node,
				children.length === 1 ? children[0] : children,
			)
	} else if (children !== undefined) {
		// children could be anything and not an array when it comes from user components
		// children will be `undefined` when there are no children at all, example `<br/>`
		createChildren(node, children)
	}

	// restore parent node
	parentNode = oldParentNode

	return node
}

// a placeholder helps to keep nodes in position

function createPlaceholder(parent, text, relative) {
	return insertNode(
		parent,
		createElementComment(
			(text || '') + (relative ? ' relative' : ''),
		),
		relative,
	)
}

// creates the children for a parent

function createChildren(parent, child, relative) {
	// string/number/undefined
	// display `undefined` because most likely is a mistake
	// in the data/by the developer
	// the only place where `undefined` is unwanted and discarded
	// is on values of styles/classes/node attributes/node properties
	if (
		typeof child === 'string' ||
		typeof child === 'number' ||
		child === undefined
	) {
		return insertNode(parent, createElementText(child), relative)
	}

	// childrens/fragments/NodeList
	if (isArray(child)) {
		return child.map(child => createChildren(parent, child, relative))
	}

	// Node
	if (child instanceof Node) {
		const node = child
		const meta = node[$meta]

		meta?.use && untrack(() => call(meta.use, node))

		insertNode(parent, node, relative)

		meta?.onMount &&
			Timing.add(TIME_MOUNT, () => call(meta.onMount, node))

		return node
	}

	// component
	if (isComponent(child)) {
		return createChildren(parent, child(), relative)
	}

	// signal/memo/external/user provided function
	if (isFunction(child)) {
		// needs placeholder to stay in position
		parent = createPlaceholder(parent, child.name, relative)

		// maybe a signal so needs an effect
		let node
		renderEffect(() => {
			node = createChildren(parent, child(), true)
			return node
		})
		// A placeholder is created and added to the document but doesnt form part of the children.
		// The placeholder needs to be returned so it forms part of the group of childrens
		// If childrens are moved and the placeholder is not moved with them, then,
		// whenever childrens update these will be at the wrong place.
		// wrong place: where the placeholder is and not where the childrens were moved to
		return [node, parent]
	}

	// the value is `null`, as in {null} or like a show returning `null` on the falsy case
	if (child === null) {
		return null
	}

	// For
	if (child instanceof MapArray) {
		// signal: needs an effect

		let node
		renderEffect(() => {
			node = child.map((child, index) => {
				// wrap the item with placeholders, to avoid resolving and for easy re-arragement
				const begin = createPlaceholder(parent, 'begin', true)
				const end = createPlaceholder(parent, 'end', true)

				return [begin, createChildren(end, child, true), end]
			})
			return node
		})
		return node
	}

	// object.toString fancy objects
	if (typeof child === 'object' && child.toString) {
		// needs placeholder to stay in position
		parent = createPlaceholder(parent, 'object', relative)

		// maybe use signals so needs an effect
		let node
		renderEffect(() => {
			node = createChildren(parent, child.toString(), true)
			return node
		})
		// A placeholder is created and added to the document but doesnt form part of the children.
		// The placeholder needs to be returned so it forms part of the group of childrens
		// If childrens are moved and the placeholder is not moved with them, then,
		// whenever childrens update these will be at the wrong place.
		// wrong place: where the placeholder is and not where the childrens were moved to
		return [node, parent]
	}

	// the very unlikely for last
	// boolean/bigint/symbol/catch all
	// toString() is needed for `Symbol`
	return insertNode(
		parent,
		createElementText(child.toString()),
		relative,
	)
}

// insert

function insertNode(parent, node, relative) {
	// check if the node has been portaled
	if (node[$meta]?.props.mount) {
		parent = node[$meta].props.mount
	}

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
			prev = head.querySelector('TITLE')
		}

		// replace old node if theres any
		prev ? prev.replaceWith(node) : head.appendChild(node)
	} else {
		relative ? parent.before(node) : parent.appendChild(node)
	}

	// get rid of children nodes on cleanup
	cleanup(() => node.remove())

	return node
}

// rendering

export function render(value, parent, clear, relative) {
	return root(dispose => {
		insert(value, parent, clear, relative, false)
		return dispose
	})
}

// insert

export function insert(value, parent, clear, relative, shouldTrack) {
	clear && clearNode(parent)

	return createChildren(
		parent || document.body,
		shouldTrack
			? value
			: isComponentable(value)
			? create(value)
			: value,
		relative,
	)
}

function clearNode(node) {
	// check for node existence to be able to use querySelector on yet to be created nodes
	if (node) node.textContent = ''
	// node.replaceChildren() thoughts?
}

// creates tagged template components
// templates are cached for the duration of a run
// cache is cleared after the run
// if you make a list with 100 links, it will reuse a component 99 times
// then discard that object
// performance opportunity: expiration could be smarter

export function template(template, ...args) {
	let cached = Components.get(template)
	if (!cached) {
		cached = createElement('pota')
		cached.innerHTML = template.join('<pota></pota>')
		Components.set(template, cached)
	}

	const clone = cached.cloneNode(true)
	const replace = clone.querySelectorAll('pota')
	for (const [index, value] of args.entries()) {
		// note: templates track by default
		// wrap components in `create(MyComponent)` to untrack
		insert(value, replace[index], null, true, true)
		replace[index].remove()
	}

	// return a single element if possible to make it more easy to use
	return clone.childNodes.length === 1
		? clone.childNodes[0]
		: // from NodeList to Array
		  [...clone.childNodes]
}

// children helper for when you need to unwrap children functions
// if you do not need the data from the children do not use this
// this should be used when you actually need the data from the children
// children helper is assumed to be used, therefore no lazy memo

export function children(fn) {
	const children = memo(fn)
	return memo(() => resolve(children()))
}

// recursively resolve all children functions and return direct children

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

// life cycles

export function onReady(fn) {
	Timing.add(TIME_READY, () => call([fn]))
}

// UTILS

// makes untracked callbacks from childrens

export function makeCallback(fns) {
	// ensure is an array
	// the transformer gives arrays but user components could return anything
	// function MyComponent() { return 'Something'} // children wont be an array
	fns = isArray(fns) ? fns : [fns]
	return markComponent((...args) =>
		untrack(() => fns.map(fn => (isFunction(fn) ? fn(...args) : fn))),
	)
}

// some props are for components use not for attributes/props
// propsData(props, ['scroll', 'replace'])
// sets props.scroll and props.replace to null, and adds it to
// props.$data = { noscroll, replace }
// data may be accessed from the node via
// getPropsData(node) === { noscroll, replace }

export function getPropsData(node) {
	return node[$meta]?.props.$data || empty()
}

// lazy memo runs only after use, by fabiospampinato@solid-js/discord

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

export function mapArray(list, cb) {
	const cache = new Map()
	const duplicates = new Map() // for when caching by value is not possible [1,2,1]

	let runId = 0
	let rows = []
	let prev = []

	// to get rid of all nodes
	cleanup(() => {
		for (const row of rows) {
			row.dispose(true)
		}
		cache.clear()
		duplicates.clear()

		rows = []
		prev = []
	})

	// create an item
	function create(item, index, fn, isDupe) {
		// a root is created so we can call dispose to get rid of an item
		return root(dispose => {
			const nodes = fn ? fn(cb(item, index), index) : cb(item, index)
			const row = {
				runId: -1,
				// this is held here only to be returned on the first run, but no need to keep it after
				nodes: runId === 1 ? nodes : null,
				// reference nodes, it holds the placeholders that delimit `begin` and `end`
				shore: [nodes[0], nodes.at(-1)],
				dispose: all => {
					// skip cache deletion as we are going to clear the full map
					if (!all) {
						// delete from cache
						!isDupe
							? cache.delete(item)
							: removeFromArray(duplicates.get(item), row)
					}
					dispose()
				},
			}
			return row
		})
	}

	return function (fn) {
		runId++

		const items = getValue(list) || []

		rows = []

		// todo: check what can be iterated
		for (const [index, item] of items.entries()) {
			let row = cache.get(item)
			// if the item doesnt exists, create it
			if (!row) {
				row = create(item, index, fn)
				cache.set(item, row)
			} else if (row.runId === runId) {
				// a map will save only 1 of any primitive duplicates, say: [1, 1, 1, 1]
				// if the saved value was already used on this run, create a new one
				let dupes = duplicates.get(item)
				if (!dupes) {
					dupes = []
					duplicates.set(item, dupes)
				}
				for (row of dupes) {
					if (row.runId !== runId) break
				}
				if (row.runId === runId) {
					row = create(item, index, fn, true)
					dupes.push(row)
				}
			}

			row.runId = runId // mark used on this run
			rows.push(row)
		}

		// remove rows that arent present on the current run
		for (const row of prev) {
			if (row.runId !== runId) row.dispose()
		}

		// reorder elements
		if (rows.length > 1) {
			// a `shore` delimits every item with a `begin` and `end` placeholder
			// you can quickly check if items are in the right order
			// by checking if item.end.nextSibling === nextItem.begin
			let current = rows[rows.length - 1].shore
			for (let i = rows.length - 1; i > 0; i--) {
				const previous = rows[i - 1].shore
				const previousEnd = previous[1]
				const currentStart = current[0]
				if (currentStart.previousSibling !== previousEnd) {
					const previousStart = previous[0]
					const nodes = [previousStart]

					let next = previousStart.nextSibling
					while (next !== previousEnd) {
						nodes.push(next)
						next = next.nextSibling
					}
					nodes.push(previousEnd)
					currentStart.before(...nodes)
				}
				current = previous
			}
		}

		// save sorted list
		prev = rows
		// return external representation
		// after the first run it lives in an effect
		if (runId === 1) {
			try {
				return rows.map(item => {
					return item.nodes
				})
			} finally {
				// remove cached nodes as these are not needed
				for (const node of rows) node.nodes = null
			}
		}
	}
}

export class MapArray {
	constructor(items, cb) {
		this.mapper = mapArray(items, cb)
	}
	map(fn) {
		return this.mapper((item, index) => fn(item, index))
	}
}

// props magic

// properties vs attributes

const NodesProperties = new Set([
	// content
	'innerHTML',
	'textContent',
	'innerText',

	// properties
	'value',
])

function assignProps(node, props) {
	for (const [name, value] of entries(props)) {
		// internal
		if (name === 'mount' || name === 'children' || name === '$data') {
			continue
		}

		// magic, no ns

		if (name === 'style') {
			setNodeStyle(node.style, value)
			continue
		}

		if (name === 'class') {
			setNodeClassList(node.classList, value)
			continue
		}

		if (NodesProperties.has(name)) {
			setNodeProperty(node, name, value)
			continue
		}

		// magic with ns

		const [ns, localName] =
			name.indexOf(':') !== -1 ? name.split(':') : ['', name]

		if (name === 'use' || ns === 'use') {
			node[$meta].use = node[$meta].use || []
			node[$meta].use.push(value)
			continue
		}

		if (name === 'onMount' || ns === 'onMount') {
			node[$meta].onMount = node[$meta].onMount || []
			node[$meta].onMount.push(value)
			continue
		}

		if (name === 'onCleanup' || ns === 'onCleanup') {
			node[$meta].onCleanup = node[$meta].onCleanup || []
			node[$meta].onCleanup.push(value)
			continue
		}

		if (ns === 'prop') {
			setNodeProperty(node, localName, value)
			continue
		}

		if (ns === 'attr') {
			setNodeAttribute(node, localName, value)
			continue
		}

		if (ns === 'style') {
			setNodeStyle(
				node.style,
				isNotNullObject(value) ? value : { [localName]: value },
			)
			continue
		}

		if (ns === 'var') {
			setNodeStyle(node.style, { ['--' + localName]: value })
			continue
		}

		if (ns === 'class') {
			setNodeClassList(
				node.classList,
				isNotNullObject(value) ? value : { [localName]: value },
			)
			continue
		}

		if (ns === 'on') {
			// delegated: no
			addEventListener(node, localName, value, false)
			continue
		}

		// onClick:my-ns={handler}
		if (ns.startsWith('on')) {
			// delegated: yes
			if (ns.toLowerCase() in window) {
				addEventListener(
					node,
					ns.toLowerCase().substr(2),
					value,
					true,
				)
				continue
			}
		}

		// onClick={handler}
		if (name.startsWith('on') && name.toLowerCase() in window) {
			// delegated: yes
			addEventListener(
				node,
				name.toLowerCase().substr(2),
				value,
				true,
			)
			continue
		}

		// catch all
		setNodeProp(node, name, value, ns)
	}
}

// node properties / attributes

function setNodeProp(node, name, value, ns) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeProp(node, name, getValue(value), ns)
		})
	} else {
		_setNodeProp(node, name, value, ns)
	}
}
function _setNodeProp(node, name, value, ns) {
	// set as property when boolean
	if (typeof value === 'boolean') {
		_setNodeProperty(node, name, value)
	} else {
		// fallback to attribute when unknown
		_setNodeAttribute(node, name, value, ns)
	}
}

// node properties

function setNodeProperty(node, name, value) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeProperty(node, name, getValue(value))
		})
	} else {
		_setNodeProperty(node, name, value)
	}
}
function _setNodeProperty(node, name, value) {
	// if the value is null or undefined it will be removed
	if (!hasValue(value)) {
		delete node[name]
	} else {
		node[name] = value
	}
}

// node attributes

function setNodeAttribute(node, name, value, ns) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeAttribute(node, name, getValue(value), ns)
		})
	} else {
		_setNodeAttribute(node, name, value, ns)
	}
}
function _setNodeAttribute(node, name, value, ns) {
	// if the value is null or undefined it will be removed
	if (!hasValue(value)) {
		ns && NS[ns]
			? node.removeAttributeNS(NS[ns], name)
			: node.removeAttribute(name)
	} else {
		ns && NS[ns]
			? node.setAttributeNS(NS[ns], name, value)
			: node.setAttribute(name, value)
	}
}

// node class / classList

// todo: the name of the class is not reactive

function setNodeClassList(classList, value) {
	if (isNotNullObject(value)) {
		for (const [name, _value] of entries(value))
			setNodeClassListValue(classList, name, _value)
		return
	}
	const type = typeof value

	if (type === 'string') {
		setNodeClassListValue(classList, value, true)
		return
	}
	if (type === 'function') {
		effect(() => {
			setNodeClassList(classList, getValue(value))
		})
		return
	}
}
function setNodeClassListValue(classList, name, value) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeClassListValue(classList, name, getValue(value))
		})
	} else {
		_setNodeClassListValue(classList, name, value)
	}
}
function _setNodeClassListValue(classList, name, value) {
	// null, undefined or false the class is removed
	if (!value) {
		classList.remove(name)
	} else {
		classList.add(...name.trim().split(/\s+/))
	}
}

// node style

function setNodeStyle(style, value) {
	if (isNotNullObject(value)) {
		for (const [name, _value] of entries(value))
			setNodeStyleValue(style, name, _value)
		return
	}
	const type = typeof value
	if (type === 'string') {
		style.cssText = value
		return
	}
	if (type === 'function') {
		effect(() => {
			setNodeStyle(style, getValue(value))
		})
		return
	}
}
function setNodeStyleValue(style, name, value) {
	if (isFunction(value)) {
		effect(() => {
			_setNodeStyleValue(style, name, getValue(value))
		})
	} else {
		_setNodeStyleValue(style, name, value)
	}
}
function _setNodeStyleValue(style, name, value) {
	// if the value is null or undefined it will be removed
	if (!hasValue(value)) {
		style.removeProperty(name)
	} else {
		style.setProperty(name, value)
	}
}

// events
// delegated and native events are hold into an array property of the node
// to avoid duplicated events that could be added by using `ns` in ease of organization

const Delegated = new Set()

export function addEventListener(node, type, handler, delegated) {
	node[$meta] = node[$meta] || (node[$meta] = empty())

	const key = delegated ? type : `${type}Native`
	const handlers = node[$meta][key] || (node[$meta][key] = [])

	if (delegated) {
		if (!Delegated.has(type)) {
			Delegated.add(type)
			document.addEventListener(type, eventHandlerDelegated) // maybe default to { passive:true }
		}
	} else {
		if (handlers.length === 0) {
			node.addEventListener(type, eventHandlerNative)
		}
	}

	handler[$meta] = isArray(handler) ? handler : [handler]

	handlers.push(handler)
}

export function removeEventListener(node, type, callback, delegated) {
	const key = delegated ? type : `${type}Native`
	const handlers = node[$meta][key]

	removeFromArray(handlers, callback)
	if (!delegated && handlers.length === 0) {
		node.removeEventListener(type, eventHandlerNative)
	}
}

function eventHandlerNative(e) {
	const key = `${e.type}Native`
	const node = e.target
	const handlers = node[$meta][key]
	eventDispatch(node, e, handlers)
}

function eventHandlerDelegated(e) {
	const key = e.type

	let node = (e.composedPath && e.composedPath()[0]) || e.target

	// reverse Shadow DOM retargetting
	// from dom-expressions
	if (e.target !== node) {
		Object.defineProperty(e, 'target', {
			value: node,
		})
	}

	// simulate currentTarget
	Object.defineProperty(e, 'currentTarget', {
		value: node,
	})

	while (node) {
		const handlers = node[$meta] && node[$meta][key]
		if (handlers && !node.disabled) {
			eventDispatch(node, e, handlers)
			if (e.cancelBubble) break
		}
		node = node.parentNode
	}
}

function eventDispatch(node, e, handlers) {
	for (const handler of handlers) {
		handler[$meta][0].call(node, e, ...handler[$meta].slice(1))
		if (e.cancelBubble) break
	}
}

// we need to ensure the timing of some callbacks, like `onMount`, `use` and `onReady`
// for this we add 1 queueMicrotask, then we queue functions in an array at a `priority` position
// once the microtask is called, we run the array of functions in order of priority

class Scheduler {
	constructor() {
		this.reset()
	}
	reset() {
		this.run = [[], [], [], []]
		this.do = false
	}
	add(priority, fn) {
		if (!this.do) {
			this.do = true
			queueMicrotask(() => this.process())
		}
		this.run[priority].push(fn)
	}
	process() {
		const run = this.run
		this.reset()
		untrack(() => {
			for (const fns of run) {
				for (const fn of fns) fn()
			}
		})
		this.finally()
	}
	finally() {
		// we are sure our job is done for this loop
		// this function runs after each "run" is complete
		// so we can add here house keeping stuff

		// clear the component cache
		Components.clear()
	}
}
const Timing = new Scheduler()
