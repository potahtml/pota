import {
	createRoot,
	createEffect,
	onCleanup,
	createSignal,
	createMemo,
	untrack,
	Signal,
} from './reactivity.js'

export function render(children, parent) {
	return createRoot(dispose => {
		insertChildren(parent, children)
		return dispose
	})
}

export function createFragment(props, ...children) {
	return children
}

export function createElement(tag, props, ...children) {
	// should return wrapped so the code runs from parent to child
	// return a memo to avoid re-excuting the components
	// example fn Component(){ return (<Show when={signal}></Show>) } will re-execute if not in a memo
	// TODO: for some unexplainable reason some components wont work without the createMemo

	// a component function
	if (typeof tag === 'function') {
		return untrack(() => tag(props, children))
	}

	// a html tag component
	return () => {
		// a regular html tag
		const element = document.createElement(tag)

		// naive assign props to the tag for the sake of testing
		if (props) {
			Object.entries(props).forEach(([name, value]) => {
				assignProps(element, name, value)
			})
		}

		// insert children one by one to avoid a useless placeholder
		children.forEach(child => insertChildren(element, child))

		return element
	}
}

function insertChildren(parent, children, position) {
	// appends a placeholder so elements stay in position
	// the placeholder is later replaced by the actual node
	// and the placeholder is restored when the node becomes null

	const marker = document.createComment('placeholder')
	let placeholder = marker

	// in the case of `For` the position is defined by the parent

	position ? parent.insertBefore(marker, position) : parent.appendChild(marker)

	// get rid of the node on cleanup
	onCleanup(() => placeholder.remove())

	return createMemo(() => {
		// a children could be a component
		const child = resolve(children)

		if (child instanceof MapArray) {
			// this function will run only for new childs
			// define position argument for childs by passing placeholder
			return child.map(child => insertChildren(parent, child, placeholder))
		} else if (Array.isArray(child)) {
			placeholder.remove()
			// array of childs
			return child.map(child => insertChildren(parent, child))
		} else if (child === null) {
			// when child is null is because one of the following:
			// 1. the value is actually null as in {null}
			// 2. the node has been removed, <Show when={false}/>
			if (placeholder.isConnected && placeholder !== marker) {
				parent.replaceChild(marker, placeholder)
			}
			placeholder = marker
			return placeholder
		} else {
			// create text node if isnt a dom element
			const element = child && child.nodeType ? child : document.createTextNode(child)

			// put the node in place replacing the placeholder or the old element
			parent.replaceChild(element, placeholder)

			// save the new node as the new placeholder (to be replaced if the node changes)
			placeholder = element

			// call onMount if defined
			child && child.onMount && child.onMount(element)
			child && child.onCleanup && onCleanup(() => child.onCleanup(element))

			return element
		}
	})
}

// control flow
// for a reason I cant explain it works only with functions (children[0])
export function Show(props, children) {
	return createMemo(() =>
		(typeof props.when === 'function' ? props.when() : props.when) ? children[0] : null,
	)
}

// naive For

export function For(props, children) {
	return createMemo(() => new MapArray(props.each, children[0]))
}

// map array

function mapArray(list, cb) {
	let runId = 0
	let map = new Map()
	let prev = []

	// to get rid of all items
	onCleanup(() => {
		for (const items of map.values()) items.dispose()
	})

	// create an item
	function create(item, index, fn) {
		// a root is created so we can call dispose to get rid of an item
		return createRoot(dispose => ({
			element: fn ? fn(cb(item, index), index) : cb(item, index),
			dispose: () => {
				dispose(), map.delete(item)
			},
		}))
	}

	return fn => {
		runId++

		const items = list() || []
		const nodes = []

		for (const [index, item] of items.entries()) {
			let row = map.get(item)
			if (!row) {
				// if the item doesnt exists, create it
				row = create(item, index, fn)
				map.set(item, row)
			} else if (row.runId === runId) {
				// a map will save only 1 of any primitive duplicates, say: [1, 1, 1, 1]
				// if the saved value was already used on this run, create a new one
				// TODO : detect this and switch to index+value
				row = create(item, index, fn)
			} else {
				// reuse
			}
			// mark used on this run
			row.runId = runId
			nodes.push(row)
		}

		// remove nodes that arent present on the current list
		for (const node of prev) {
			if (node.runId !== runId) node.dispose()
		}

		// save list
		prev = nodes

		// return external representation
		return nodes.map(item => item.element)
	}
}

class MapArray {
	constructor(items, cb) {
		this.mapper = mapArray(items, cb)
	}
	map(fn) {
		const nodes = resolve(this.mapper((item, index) => fn(item)))

		// check order of elements
		for (let i = nodes.length - 1; i > 0; i--) {
			const prev = nodes[i - 1]
			const node = nodes[i]
			if (node.previousSibling !== prev) {
				node.parentNode.insertBefore(prev, node)
			}
		}
		return nodes
	}
}

// helpers

function resolve(children) {
	if (typeof children === 'function') {
		return resolve(children())
	}

	if (Array.isArray(children)) {
		return (
			children
				// flat to an array of childrens
				.flat(Infinity)
				// resolve any functions
				.map(child => resolve(child))
				// these may return arrays, flat the result
				.flat(Infinity)
		)
	}
	return children
}

// naive assign props

function assignProps(element, name, value) {
	if (name === 'onMount') {
		element.onMount = value
	} else if (name === 'onCleanup') {
		element.onCleanup = value
	} else if (value === null || value === undefined) {
		element.removeAttribute(name)
	} else if (name === 'style') {
		if (typeof value === 'string') {
			element.style.cssText = value
		} else {
			Object.entries(value).forEach(([name, value]) => {
				createEffect(() => {
					element.style[name] = typeof value === 'function' ? value() : value
				})
			})
		}
	} else if (name.startsWith('on') && name.toLowerCase() in window) {
		element.addEventListener(name.toLowerCase().substr(2), value)
	} else {
		element[name] = value
		element.setAttribute(name, value)
	}
}
