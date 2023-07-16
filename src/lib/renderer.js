import {
	createRoot,
	createEffect,
	onCleanup,
	createSignal,
	createMemo,
	untrack,
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

function marker(s) {
	return document.createComment(s || 'placeholder')
}

export function createElement(tag, props, ...children) {
	// should return wrapped so the code runs from parent to child

	// a component function
	if (typeof tag === 'function') {
		return untrack(() => tag(props, children))
	}

	// a html tag component
	return () => {
		// a regular html tag
		const element = document.createElement(tag)

		// naive assign props to the tag for the sake of testing
		if (props)
			Object.entries(props).forEach(([name, value]) => {
				assignProps(element, name, value)
			})

		// get rid of the node on cleanup
		onCleanup(() => element.remove())

		// insert children one by one to avoid a useless placeholder
		children.forEach(child => insertChildren(element, child))

		return element
	}
}

function insertChildren(parent, children, placeholder) {
	// appends a placeholder so elements stay in position
	// the placeholder is later replaced by the actual node
	// and the placeholder is restored when the node becomes null

	placeholder = !placeholder
		? parent.appendChild(marker(/* 'parent doesnt provide placeholder' */))
		: placeholder.parentNode.insertBefore(
				marker(/*'placeholder from parent'*/),
				placeholder,
		  )

	// get rid of the node on cleanup
	onCleanup(() => placeholder.remove())

	return createMemo(() => {
		// a children could be a function
		const child = resolve(children)

		if (child instanceof MapArray) {
			// this function will run only for new childs
			return child.map(child => insertChildren(parent, child, placeholder))
		} else if (Array.isArray(child)) {
			// array of childs
			return child.map(child => insertChildren(parent, child, placeholder))
		} else if (child === null) {
			// the value is actually null
			return placeholder
		} else {
			// create text node if isnt a dom element
			const element = child && child.nodeType ? child : document.createTextNode(child)

			// TODO: onCleanup(() => element.remove())

			// put the node in place by replacing the placeholder or the old element
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

export function Show(props, children) {
	return createMemo(() =>
		(typeof props.when === 'function' ? props.when() : props.when) ? children : null,
	)
}

// naive For

export function For(props, children) {
	return createMemo(() => new MapArray(props.each, children[0]))
}

// map array
// TODO: avoid the prev object by doing something clever with the map itself
function mapArray(list, cb) {
	const map = new Map()
	const byIndex = ' _ cached by index _ '

	let runId = 0
	let prev = []

	// to get rid of all items
	onCleanup(() => {
		for (const items of map.values()) items.dispose()
	})

	// create an item
	function create(item, index, fn) {
		// a root is created so we can call dispose to get rid of an item
		return createRoot(dispose => ({
			item,
			element: fn ? fn(cb(item, index), index) : cb(item, index),
			dispose: () => {
				dispose(), map.delete(item), map.delete(index + byIndex)
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

				// to avoid the previous problem, cache the value by index
				row = map.get(index + byIndex)
				if (!row || row.item !== item) {
					row = create(item, index, fn)
					map.set(index + byIndex, row)
				}
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

		// order of elements may have changed, reorder it
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
				// resolve any children
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
