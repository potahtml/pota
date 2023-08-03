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
	cleanup as onCleanup,
	signal,
	memo,
	untrack,
	createContext,
	useContext,
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

// while not needed these make the logic/code more concise/readable

const assign = Object.assign
const entries = Object.entries
const empty = Object.create.bind(Object, null)

export const isArray = Array.isArray
export const isFunction = v => typeof v === 'function'
export const isComponent = v =>
	typeof v === 'function' && v[$component] === true
const isDisplayable = v => {
	const type = typeof v
	return (
		type === 'string' ||
		type === 'number' ||
		type === 'boolean' ||
		type === 'bigint' ||
		// show undefined because most likely is a mistake
		// in the data/by the developer
		// the only place where undefined is unwanted and discarded
		// is on values of styles/classes/node attributes/node properties
		v === undefined
	)
}

// the following set of functions are based on the renderer assumptions
// these are not mean to be generic JavaScript functions
const isNotNullObject = v => v !== null && typeof v === 'object'
export const hasValue = v => v !== null && v !== undefined
export const getValue = v =>
	typeof v === 'function' ? getValue(v()) : v
// runs arrays of functions with arguments
const call = (fns, ...args) => {
	fns.forEach(fn => {
		if (isArray(fn)) {
			fn[0](...args, ...fn.slice(1))
		} else {
			fn(...args)
		}
	})
}

// todo: allow to change document
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
export function Fragment() {}

// used by the JSX transform
// Component is not supposed to be used in user land
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
		props = empty()
		props.children = children
	} else if (!('children' in props)) {
		// use `in` to not trigger getters
		// only set `children` if the props dont have it already
		// when the `props.children` is set, it takes over the component own children:
		// <div children={[1,2,3]}>CHILDREN IS IGNORED HERE</div>
		props.children = children
	}

	// create component instance with bind, props, and a scope initially set to an empty object
	// the scope is used to hold the parent to be able to tell if dynamic childrens are XML
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
	// think of const MyComponent = create('div'), AnotherComponent({children:create(MyComponent)({..props..})})
	// the jsx transformer doesnt do that, but I can see how that could happen with user crafted components
	if (isComponent(value)) {
		return value
	}

	return markComponent(Factory(value))
}

// the components factory
// creates a function that could be called with a props object
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
		// objects with a custom .toString()
		component = (props = empty(), scope = empty()) =>
			untrack(() => value.toString(props, props.children, scope))
	}

	// save in cache
	Components.set(value, component)

	return component
}

// allows to tell a `signal function` from a `component function`
// signals and user functions go in effects, for reactivity
// components are untracked to avoid re-rendering and wont go in effects

const componentMark = empty()
componentMark[$component] = true
export const markComponent = function (o, fn) {
	return assign(fn, o)
}.bind(null, componentMark)

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
	// appears in the dev tools for easy debugging

	node[$meta] = scope
	node[$meta].node = node
	node[$meta].props = props

	// on first run this will hold a value
	// once reactivity takes over (like a Show), then,
	// it wont and we use old parent which is saved on the scope
	if (parentNode[$meta]) {
		node[$meta].parent = parentNode[$meta]
	}

	// keep track of parent nodes
	const oldParentNode = parentNode
	parentNode = node

	// get rid of the node on cleanup
	cleanup(() => {
		// callback
		node[$meta].onCleanup &&
			untrack(() => call(node[$meta].onCleanup, node))
		node.remove()
	})

	// assign the props to the node
	assignProps(node, props)

	// insert childrens
	// in line the most common case of 1 children, or no children at all
	if (isArray(children)) {
		if (children.length) {
			createChildren(
				node,
				children.length === 1 ? children[0] : children,
			)
		}
	} else {
		// children is possibly not an array when it comes from user components
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
			(text || '') + (relative ? ' by parent' : ''),
		),
		relative,
	)
}

// creates the children for a parent

function createChildren(parent, child, relative) {
	// string/number/undefined/boolean/bigint
	if (isDisplayable(child)) {
		return insertNode(parent, createElementText(child), relative)
	}

	// childrens/fragments
	if (isArray(child)) {
		return child.map(child => createChildren(parent, child, relative))
	}

	// Node
	if (child instanceof Node) {
		const node = child

		node[$meta]?.use && untrack(() => call(node[$meta].use, node))

		insertNode(parent, node, relative)

		node[$meta]?.onMount &&
			Timing.add(1, () => call(node[$meta].onMount, node))

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
		return node
	}

	// the value is null, as in {null}
	if (child === null) {
		return null
	}

	// For
	if (child instanceof MapArray) {
		// signal: needs an effect
		let node
		renderEffect(() => {
			node = child.map((child, index) => {
				// we know we need to insert it in a relative position
				// because the parent comes from a memo() placeholder
				return createChildren(parent, child, true)
			})
			return node
		})
		return node
	}

	// symbol/object/catch all
	// toString() is needed for symbols and any fancy objects
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

	// special case head
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

		if (prev) {
			// replace node
			prev.replaceWith(node)

			// restore old node on cleanup
			cleanup(() => {
				// bug: there's a race condition when restoring the tag
				// it could happen that the tag is restored after we changed pages and appended already a new one

				// it needs appendChild instead of replaceWith here because
				// our node gets cleaned up by the reactivity
				head.appendChild(prev)
			})
		} else {
			// tag not found, append it
			head.appendChild(node)
		}
	} else {
		relative ? parent.before(node) : parent.appendChild(node)

		// get rid of text nodes on cleanup
		cleanup(() => node.remove())
	}

	return node
}

// rendering

export function render(value, parent, clear, relative) {
	return root(dispose => {
		insert(value, parent, clear, relative)
		return dispose
	})
}

// insert

export function insert(value, parent, clear, relative, shouldtrack) {
	clear && clearNode(parent)

	return createChildren(
		parent || document.body,
		shouldtrack ? value : isFunction(value) ? create(value) : value,
		relative,
	)
}

function clearNode(node) {
	if (node) node.textContent = ''
	// node.replaceChildren() thoughts?
}

// templates are cached for the duration of a run
// cache is cleared after the run
// if you make a list with 100 links, it will reuse a component 99 times
// then discard that object
// performance opportunity: expiration could be smarter

// I love the following function

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
		insert(value, replace[index], null, true, true)
		replace[index].remove()
	}

	// from NodeList to Array
	const result = [...clone.childNodes]
	// return a single element if possible to ease usage
	return result.length === 1 ? result[0] : result
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
	Timing.add(2, () => call([fn]))
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

export function mapArray(list, cb) {
	const map = new Map()
	// when caching by value is not possible [1,2,1]
	// to use the same Map append this to each index to avoid a collision with the values
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
		// TODO: maybe we can avoid/reuse the root here?
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

export class MapArray {
	constructor(items, cb) {
		this.mapper = mapArray(items, cb)
	}
	map(fn) {
		// needs the children for sorting, so calling resolve
		let nodes = resolve(this.mapper((item, index) => fn(item, index)))

		// order of nodes may have changed, reorder it
		if (nodes.length > 1) {
			/*	const parent = nodes[0].parentNode
					for (let i = nodes.length - 1; i > 0; i--) {
						const prev = nodes[i - 1]
						const node = nodes[i]
						if (node.previousSibling !== prev) {
							node.parentNode.insertBefore(prev, node)
						}
					}*/
		}
		return nodes
	}
}

// properties vs attributes
// from dom-expressions

// todo: this has a weird mix of lowercase vs case sensitive
// this is a bit messy, maybe default to prop and special case attributes?

const NodesPropertiesBooleans = [
	'allowfullscreen',
	'async',
	'autofocus',
	'autoplay',
	'checked',
	'controls',
	'default',
	'disabled',
	'formnovalidate',
	'hidden',
	'indeterminate',
	'ismap',
	'loop',
	'multiple',
	'muted',
	'nomodule',
	'novalidate',
	'open',
	'playsinline',
	'readonly',
	'required',
	'reversed',
	'seamless',
	'selected',
]
const NodesProperties = new Set([
	// content
	'innerHTML',
	'textContent',
	'innerText',

	// properties
	'value',
	'readOnly',
	'formNoValidate',
	'isMap',
	'noModule',
	'playsInline',
	...NodesPropertiesBooleans,
])

function assignProps(node, props) {
	for (const [name, value] of entries(props)) {
		// internal

		if (name === 'mount' || name === 'children') {
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

		if (ns === 'prop' || ns === 'p') {
			setNodeProperty(node, localName, value)
			continue
		}
		if (ns === 'attr' || ns === 'a') {
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

		// default to attribute
		setNodeAttribute(node, name, value, ns)
	}
}

// node properties / attributes

function setNodeProperty(node, name, value) {
	if (isFunction(value)) {
		effect(() => _setNodeProperty(node, name, getValue(value)))
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
function setNodeAttribute(node, name, value, ns) {
	if (isFunction(value)) {
		effect(() => _setNodeAttribute(node, name, getValue(value), ns))
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
		effect(() => setNodeClassList(classList, getValue(value)))
		return
	}
}
function setNodeClassListValue(classList, name, value) {
	if (isFunction(value)) {
		effect(() =>
			_setNodeClassListValue(classList, name, getValue(value)),
		)
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
		effect(() => setNodeStyle(style, getValue(value)))
		return
	}
}
function setNodeStyleValue(style, name, value) {
	if (isFunction(value)) {
		effect(() => _setNodeStyleValue(style, name, getValue(value)))
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

// todo removeEventListener
export function addEventListener(node, type, handler, delegate) {
	let key = type
	if (delegate) {
		node[$meta][key] = node[$meta][key] || []
		if (!Delegated.has(type)) {
			Delegated.add(type)
			// performance opportunity: maybe default to { passive:true }
			// TODO: remove it once the nodes get cleared
			document.addEventListener(type, eventHandlerDelegated)
		}
	} else {
		key += 'Native'
		if (!node[$meta][key]) {
			node[$meta][key] = []
			node.addEventListener(type, eventHandlerNative)
		}
	}

	node[$meta][key].push(isArray(handler) ? handler : [handler])
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
	for (const [handler, ...data] of handlers)
		handler.call(node, e, ...data)
}

// we need to ensure the timing of some callbacks, like onMount, use and onReady
// for this we add 1 queueMicrotask, then we queue in an array at a `priority` position
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
		// this function runs after each run is done
		// so we can add here house keeping stuff

		// clear the component cache
		Components.clear()
	}
}
const Timing = new Scheduler()
