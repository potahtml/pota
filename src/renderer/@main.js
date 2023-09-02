const DEV = false

// reactivity

import {
	root,
	renderEffect,
	cleanup,
	memo,
	untrack,
} from '#primitives'

// constants

import {
	// symbols
	$meta,
	// namespace
	NS,
	// to ensure timing of events callbacks are queued to run at specific times
	TIME_MOUNT,
	TIME_READY,
} from './constants.js'

// while not needed these make the logic/code more concise/readable

import {
	empty,
	isArray,
	isFunction,
	call,
	removeFromArray,
	getValue,
} from '#std'

// renderer lib

import {
	isClassComponent,
	isComponent,
	isComponentable,
	markComponent,
} from '#comp'

// context

import { context } from '#reactivity'

// properties / attributes

import { assignProps } from './props/@main.js'

// document

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
export function Component(value, props) {
	// special case fragments, these are arrays and dont need untrack nor props
	if (value === Fragment) {
		// <>...</>
		return props.children
	}

	// the scope/context is used to hold the parent to be able to tell if dynamic childrens are XML
	const scope = empty()

	/*
		const some = create('div')
 		some === () => createDiv
 		some !== Factory(some)
		the factory wont recognize `some` as an already seen component
		because we are returning a new function
		by checking if its already a component we avoid this problem
	*/
	if (isComponent(value)) {
		return markComponent(() => value(props, scope))
	}

	// create component instance with props, and a scope/context initially set to an empty object
	return markComponent(() => Factory(value)(props, scope))
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
	// `const MyComponent = create('div')
	// AnotherComponent({children:create(MyComponent)({..props..})})`
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
	} else if (isClassComponent(value)) {
		// a class component <MyComponent../>
		component = (props = empty(), scope = empty()) =>
			untrack(() => {
				const instance = new value()
				instance.onReady &&
					Timing.add(TIME_READY, instance.onReady.bind(instance))
				instance.onCleanup &&
					cleanup(instance.onCleanup.bind(instance))

				return instance.render(props, props.children, scope)
			})
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

// keeps track of parentNode for `xmlns` spreading to children
// defaults to empty object so parentNode.namespaceURI doesnt throw

const useParentNode = context(empty())

// creates a x/html element from a tagName

function createTag(tagName, props, children, scope) {
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
		children,
		scope,
	)
}

function createNode(node, props, children, scope) {
	// sets internals properties of the node
	// allows to lookup mount, parent node for xmlns, holds events handlers
	// appears in the dev tools at the node properties for easy debugging

	// assign the scope to the node
	node[$meta] = scope

	if (node.namespaceURI !== NS.html) {
		scope.namespaceURI = node.namespaceURI
	}

	if (props.mount) {
		scope.mount = props.mount
	}

	const parentNode = useParentNode()

	// on first run this will hold a value
	// once reactivity takes over (like a Show), then,
	// it wont and we use old parent which is already saved on the scope from the previous run
	if (parentNode[$meta]) {
		scope.parent = parentNode[$meta]
	}

	// to be able to access some magic props from the node
	scope.$data = props.$data = empty()

	// get rid of the node on cleanup
	cleanup(() => {
		// callbacks
		scope.onCleanup && call(scope.onCleanup, node)
		// remove from the document
		node.isConnected && node.remove()
	})

	useParentNode(node, () => {
		// assign the props to the node
		assignProps(node, props)

		// insert childrens
		// children will be `undefined` when there are no children at all, example `<br/>`
		if (children !== undefined) {
			createChildren(node, children)
		}
	})

	return node
}

// a placeholder helps to keep nodes in position

function createPlaceholder(parent, text, relative) {
	return insertNode(
		parent,
		DEV
			? createElementComment(
					(text || '') + (relative ? ' relative' : ''),
			  )
			: createElementText(''),

		relative,
	)
}

// creates the children for a parent

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
			// if (isFunction(child)) {
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
			// }
		}

		case 'object': {
			// childrens/fragments/NodeList
			if (isArray(child)) {
				return child.map(child =>
					createChildren(parent, child, relative),
				)
			}

			// Node
			if (child instanceof Node) {
				const node = child
				const meta = node[$meta]

				insertNode(parent, node, relative)

				meta?.onMount &&
					Timing.add(TIME_MOUNT, () => call(meta.onMount, node))

				return node
			}

			// For
			if (child instanceof ReactiveMap) {
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

			// the value is `null`, as in {null} or like a show returning `null` on the falsy case
			if (child === null) {
				return null
			}

			// object.toString fancy objects
			// if ( child.toString) {
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
			// }
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

// insert
function insertNode(parent, node, relative) {
	// check if the node has been portaled
	if (node[$meta]?.mount) {
		parent = node[$meta].mount
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

// rendering

export function render(value, parent, clear, relative) {
	return root(dispose => {
		insert(value, parent, clear, relative)
		return dispose
	})
}

// insert

export function insert(value, parent, clear, relative) {
	clear && clearNode(parent)

	return createChildren(
		parent || document.body,
		isComponentable(value) ? create(value) : value,
		relative,
	)
}

function clearNode(node) {
	// check for node existence to be able to use querySelector on yet to be created nodes
	if (node) node.textContent = ''
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
		insert(
			// insert creates components for things to insert.
			// for nodes it will use cloneNode
			// this will cause any event listener to be lost
			// for this reason we wrap it on a function
			value instanceof Node ? () => value : value,
			replace[index],
			null,
			true,
		)
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
				? childrens.push(...child)
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

// Map Array

export function map(list, cb, sort) {
	const cache = new Map()
	const duplicates = new Map() // for when caching by value is not possible [1,2,1]

	let runId = 0

	let rows = []
	let prev = []

	function clear() {
		for (const row of prev) {
			row.dispose(true)
		}
		cache.clear()
		duplicates.clear()

		rows.length = 0
		prev.length = 0
	}

	// to get rid of all nodes
	cleanup(clear)

	// create an item
	function create(item, index, fn, isDupe) {
		// a root is created so we can call dispose to get rid of an item
		return root(dispose => {
			const nodes = fn
				? fn(cb(item /*, index*/) /*, index*/)
				: cb(item /*, index*/)

			const row = {
				runId: -1,
				// this is held here only to be returned on the first run, but no need to keep it after
				nodes: runId === 1 ? nodes : null,
				// reference nodes, it holds the placeholders that delimit `begin` and `end`
				shore: !sort ? [] : [nodes[0], nodes.at(-1)],
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
		const items = getValue(list) || []

		return untrack(() => {
			const values = items
			runId++
			rows = []

			for (const [index, item] of values.entries()) {
				let row = cache.get(item)

				// if the item doesnt exists, create it
				if (!row) {
					row = create(item, index, fn, false)
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
			if (rows.length === 0) {
				clear()
			} else {
				for (const row of prev) {
					if (row.runId !== runId) row.dispose()
				}
			}

			// reorder elements
			// prev.length > 0 to skip sorting on creation as its already sorted
			if (sort && rows.length > 1 && prev.length > 0) {
				// a `shore` delimits every item with a `begin` and `end` placeholder
				// you can quickly check if items are in the right order
				// by checking if item.end.nextSibling === nextItem.begin

				for (let i = 0; i < rows.length - 1; i++) {
					const current = rows[i].shore
					const next = rows[i + 1].shore
					if (current[1] !== next[0].previousSibling) {
						const start = next[0]
						const end = next[1]
						const nodes = [start]

						let nextSibling = start.nextSibling
						while (nextSibling !== end) {
							nodes.push(nextSibling)
							nextSibling = nextSibling.nextSibling
						}
						nodes.push(end)
						current[1].after(...nodes)
					}
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
					// remove cached nodes as these are not needed after the first run
					for (const node of rows) node.nodes = null
				}
			}
		})
	}
}

export class ReactiveMap {
	constructor(items, cb) {
		this.mapper = map(items, cb, true)
	}
	map(fn) {
		return this.mapper(fn)
	}
}

// some props are for components use not for attributes/props
// propsData(props, ['scroll', 'replace'])
// sets props.scroll and props.replace to null, and adds it to
// props.$data = { noscroll, replace }
// data may be accessed from the node via
// getPropsData(node) === { noscroll, replace }

export function getPropsData(node) {
	return node[$meta]?.$data || empty()
}

// we need to ensure the timing of some callbacks, like `onMount`, and `onReady`
// for this we add 1 queueMicrotask, then we queue functions in an array at a `priority` position
// once the microtask is called, we run the array of functions in order of priority

import { Scheduler } from '#time'

const Timing = new Scheduler(
	// callback
	cb => untrack(cb),
	// finally
	() => {
		// we are sure our job is done for this loop
		// this function runs after each "run" is complete
		// so we can add here house keeping stuff

		// clear the component cache
		Components.clear()
	},
)
