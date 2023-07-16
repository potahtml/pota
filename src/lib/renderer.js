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

const NS = {
	svg: 'http://www.w3.org/2000/svg',
	math: 'http://www.w3.org/1998/Math/MathML',
	html: 'http://www.w3.org/1999/xhtml',
}
const NSProps = {
	'xlink:href': 'http://www.w3.org/1999/xlink',
}

// should return wrapped so the code runs from parent to child
export function createElement(tag, props, ...children) {
	// a component function
	if (typeof tag === 'function') {
		return untrack(() => tag(props, children))
	}

	// a html tag component
	return parent => {
		// resolve the namespace
		const ns =
			props && props.xmlns
				? props.xmlns // the prop contains the namespace
				: parent.namespaceURI !== NS.html
				? parent.namespaceURI // the parent contains the namespace
				: NS[tag] // special case svg, math in case of missing xmlns attribute

		const node = ns ? document.createElementNS(ns, tag) : document.createElement(tag)

		// naive assign props to the tag for the sake of testing
		if (props)
			Object.entries(props).forEach(([name, value]) => {
				assignProps(node, name, value)
			})

		// get rid of the node on cleanup
		onCleanup(() => node.remove())

		// insert children
		insertChildren(node, children)

		return node
	}
}

function insertChildren(parent, children, placeholder) {
	// 1. avoids tracking by unwrapping the array earlier
	// 2. it also avoids some placeholders
	if (Array.isArray(children))
		return children.map(child => insertChildren(parent, child, placeholder))

	// a placeholder helps to keep nodes in position
	// the placeholder is later replaced by the actual node
	// the placeholder is restored when the node becomes null
	placeholder = !placeholder
		? parent.appendChild(marker(/* 'parent doesnt provide placeholder' */))
		: // in the case of arrays, position nodes relative to the component
		  parent.insertBefore(marker(/*'placeholder from parent'*/), placeholder)

	// get rid of the node on cleanup
	onCleanup(() => placeholder.remove())

	return createMemo(() => {
		// a children is most likely a function
		const child = resolve(children, parent)

		if (child instanceof MapArray) {
			// `For`, the callback function will run only for new childs
			return child.map(child => insertChildren(parent, child, placeholder), parent)
		} else if (Array.isArray(child)) {
			return child.map(child => insertChildren(parent, child, placeholder))
		} else if (child === null) {
			// the value is null, as in {null}
			return placeholder
		} else {
			// create a text node if isnt a dom node
			const node = child && child.nodeType ? child : document.createTextNode(child)

			// put the node in place by replacing the placeholder or the old node
			parent.replaceChild(node, placeholder)

			// save the new node as the new placeholder (to be replaced if the node changes)
			placeholder = node

			// call onMount if defined
			child && child.onMount && child.onMount(node)
			child && child.onCleanup && onCleanup(() => child.onCleanup(node))

			return node
		}
	})
}

// control flow

export function Show(props, children) {
	return createMemo(() =>
		(typeof props.when === 'function' ? props.when() : props.when) ? children : null,
	)
}

// For

export function For(props, children) {
	return createMemo(() => new MapArray(props.each, children[0]))
}

// map array

function mapArray(list, cb) {
	const map = new Map()
	const byIndex = ' _ cached by index _ '

	let runId = 0
	let prev = []

	// to get rid of all nodes
	onCleanup(() => {
		for (const row of map.values()) row.dispose()
	})

	// create an item
	function create(item, index, fn, byIndex) {
		// a root is created so we can call dispose to get rid of an item
		return createRoot(dispose => ({
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

class MapArray {
	constructor(items, cb) {
		this.mapper = mapArray(items, cb)
	}
	map(fn, parent) {
		const nodes = resolve(
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

// helpers

function resolve(children, parent) {
	if (typeof children === 'function') {
		return resolve(children(parent), parent)
	}

	if (Array.isArray(children)) {
		return (
			children
				// flat to an array of childrens
				.flat(Infinity)
				// resolve any children
				.map(child => resolve(child, parent))
				// these may return arrays, flat the result
				.flat(Infinity)
		)
	}
	return children
}

function marker(s) {
	return document.createComment(s || 'placeholder')
}

// naive assign props

function assignProps(node, name, value) {
	if (name === 'onMount') {
		node.onMount = value
	} else if (name === 'onCleanup') {
		node.onCleanup = value
	} else if (value === null || value === undefined) {
		NSProps[name]
			? node.removeAttributeNS(NSProps[name], name, value)
			: node.removeAttribute(name)
	} else if (name === 'style') {
		if (typeof value === 'string') {
			node.style.cssText = value
		} else {
			Object.entries(value).forEach(([name, value]) => {
				createEffect(() => {
					node.style[name] = typeof value === 'function' ? value() : value
				})
			})
		}
	} else if (name.startsWith('on') && name.toLowerCase() in window) {
		node.addEventListener(name.toLowerCase().substr(2), value)
	} else {
		NSProps[name]
			? node.setAttributeNS(NSProps[name], name, value)
			: node.setAttribute(name, value)
	}
}
