import {
	$isClass,
	$isComponent,
	$isMap,
	$isReactive,
} from '../constants.js'

import {
	emptyArray,
	unwrapArray,
	getValue,
	groupBy,
	isArray,
	isFunction,
	isObject,
	isPromise,
	keys,
	nothing,
	queueMicrotask,
	removeFromArray,
	resolved,
	withResolvers,
	toEntries,
} from './std.js'

// solid

import { createReactiveSystem, markReactive } from './solid.js'

const {
	batch,
	cleanup,
	cleanupCancel,
	Context,
	effect,
	memo,
	on,
	owned,
	owner,
	root,
	runWithOwner,
	signal,
	syncEffect,
	untrack,
} = createReactiveSystem()

export {
	batch,
	cleanup,
	cleanupCancel,
	Context,
	effect,
	memo,
	on,
	owned,
	owner,
	root,
	runWithOwner,
	signal,
	syncEffect,
	untrack,
	markReactive,
	createReactiveSystem,
}

/**
 * Returns true when value is reactive (a signal)
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export const isReactive = value =>
	isFunction(value) && $isReactive in value

/**
 * Proxies a signals property access so you dont have to call the
 * function
 *
 * @template {T extends object}
 * @param {SignalAccessor<T>} snigal - Signal to proxy
 * @param {object} [target] - Target object for the proxy
 * @returns {object} An object that will read the properties from the
 *   signal
 */
export const proxy = (snigal, target = nothing) =>
	new Proxy(target, {
		get(target, key) {
			return snigal()[key]
		},
		has(target, key) {
			return key in snigal()
		},
		ownKeys(target) {
			return keys(snigal())
		},
	})

/**
 * A self contained signal function, when an argument is present it
 * writes to the signal, when theres no argument it reads the signal.
 *
 * @template T
 * @param {T} [value] - Optional initial value
 * @returns {SignalFunction<T>}
 */
export function signalFunction(value) {
	const [read, write] = signal(value)
	return markReactive((...args) =>
		args.length ? write(args[0]) : read(),
	)
}

/**
 * To set and read refs. To use in ref attribute.
 *
 * @template T
 * @returns {SignalFunction<T>}
 */
export const ref = () => signalFunction()

/**
 * Runs a function inside an effect if value is a function.
 * Aditionally unwraps promises.
 *
 * @template T
 * @param {(() => T) | Promise<T> | T} value
 * @param {(value: T) => unknown} fn
 */
export function withValue(value, fn) {
	if (isFunction(value)) {
		effect(() => withValue(getValue(value), fn))
	} else if (isPromise(value)) {
		value.then(owned(value => withValue(value, fn)))
	} else {
		fn(value)
	}
}

/**
 * Runs a function inside an effect if value is a function
 *
 * @param {unknown} value
 * @param {(value: unknown, prev?: unknown) => unknown} fn
 */
export function withPrevValue(value, fn) {
	if (isFunction(value)) {
		let prev
		effect(() => {
			const val = getValue(value)
			fn(val, prev)
			prev = val
		})
	} else {
		fn(value)
	}
}

/**
 * Lazy and writable version of `memo`, its writable and will run the
 * function only when used
 *
 * @author ryansolid
 * @template T
 * @type SignalFunction<T>
 * @param {() => T} fn - Function to re-run when dependencies change
 * @returns {SignalFunction<T>}
 */
export function writable(fn) {
	const result = memo(() => signal(fn()))
	return markReactive((...args) => {
		return args.length ? result().write(args[0]) : result().read()
	})
}

/**
 * Creates an asynchronously effect
 *
 * @param {(currentRunningEffect: Promise<any>) => any} fn - A
 *   function that receives a `currentRunningEffect` that should be
 *   awaited for when wanting to run effects synchronously, that's it
 *   one effect after another.
 */
export function asyncEffect(fn) {
	const queue = []
	effect(() => {
		const { promise, resolve } = withResolvers()

		queue.push(promise)

		function onDone() {
			removeFromArray(queue, promise)
			resolve()
		}

		resolved(
			fn(queue.length === 1 ? undefined : queue[queue.length - 2]),
			onDone,
		)
	})
}

/**
 * A Promise loader handler. Allows to display/run something or
 * nothing while a promise is resolving. Allows to run a callback when
 * the promise resolves. Allows to get notified of errors, and
 * display/run something or nothing, if wanted a `retry` function is
 * given for retrying the promise. All functions run with the original
 * owner, so it's `Context` friendly.
 *
 * @param {(() => Promise<any>) | Promise<any>} fn - Function that
 *   returns a promise
 * @param {{
 * 	onLoading?: any
 * 	onLoad?: () => unknown
 * 	onError?: ((e: Error, retry: Function) => any) | any
 * }} [options]
 *
 * @returns {Component}
 * @url https://pota.quack.uy/lazy
 */
export const lazy = (fn, options = nothing) =>
	markComponent(props => {
		const { onLoading, onLoad, onError } = options

		const [value, setValue] = signal(onLoading)

		const onLoaded = owned(onLoad)

		const retry = () =>
			Promise.resolve(isFunction(fn) ? fn() : fn)
				.then(r => {
					setValue(
						markComponent(() => {
							r = isObject(r) && r.default ? r.default : r
							return isFunction(r) ? r(props) : r
						}),
					)
					microtask(onLoaded)
				})
				.catch(e =>
					onError
						? setValue(
								markComponent(() =>
									isFunction(onError) ? onError(e, retry) : onError,
								),
							)
						: console.error(e),
				)
		retry()

		return value
	})

export const Lazy = props => lazy(props.children, props)

export const microtask = fn => queueMicrotask(owned(fn))

// MAP

class Row {
	runId
	item
	index
	isDupe
	disposer
	nodes

	constructor(item, index, fn, isDupe) {
		this.item = item
		this.index = index
		this.isDupe = isDupe

		root(disposer => {
			this.disposer = disposer
			/** @type Children[] */
			this.nodes = fn(item, index)
		})
	}
	begin() {
		return this.nodes[0]
	}
	end() {
		return this.nodes[this.nodes.length - 1]
	}
	nodesForRow() {
		const begin = this.begin()
		const end = this.end()

		const nodes = [begin]

		let nextSibling = begin
		while (nextSibling !== end) {
			nextSibling = nextSibling.nextSibling
			nodes.push(nextSibling)
		}

		return nodes
	}
}

/**
 * Reactive Map
 *
 * @template T
 * @param {Each<T>} list
 * @param {Function} callback
 * @param {boolean} [sort]
 * @param {Children} [fallback]
 */
export function map(list, callback, sort, fallback) {
	const cache = new Map()
	const duplicates = new Map() // for when caching by value is not possible [1, 2, 1, 1, 1]

	let runId = 0

	let rows = []
	/** @type any[] */
	let prev = []

	function clear() {
		for (const row of prev) {
			row.disposer()
		}
		cache.clear()
		duplicates.clear()

		rows.length = 0
		prev.length = 0
	}

	// to get rid of all nodes when parent disposes
	cleanup(clear)

	function dispose(row) {
		// delete from cache
		if (!row.isDupe) {
			cache.delete(row.item)
		} else {
			const arr = duplicates.get(row.item)
			arr.length === 1
				? duplicates.delete(row.item)
				: removeFromArray(arr, row)
		}

		row.disposer()
	}

	/**
	 * @param {Function} fn
	 * @returns {Children}
	 */
	function mapper(fn) {
		const cb = fn
			? (item, index) => fn(callback(item, index), index)
			: callback

		const value = getValue(list) || []

		/** To allow iterate objects as if were an array with indexes */
		const items = toEntries(value)

		runId++
		rows = []
		const hasPrev = prev.length

		for (const [index, item] of items) {
			let row = hasPrev ? cache.get(item) : undefined

			// if the item doesnt exists, create it
			if (row === undefined) {
				row = new Row(item, index, cb, false)
				cache.set(item, row)
			} else if (row.runId === runId) {
				// a map will save only 1 of any primitive duplicates, say: [1, 1, 1, 1]
				// if the saved value was already used on this run, create a new one
				let dupes = duplicates.get(item)
				if (!dupes) {
					dupes = []
					duplicates.set(item, dupes)
				}
				for (const dupe of dupes) {
					if (dupe.runId !== runId) {
						row = dupe
						break
					}
				}
				if (row.runId === runId) {
					row = new Row(item, index, cb, true)
					dupes.push(row)
				}
			}

			row.runId = runId // mark used on this run
			row.index = index // save sort order
			rows.push(row)
		}

		// fast clear
		if (rows.length === 0) {
			clear()
			prev = rows
			return fallback ? fn(fallback) : emptyArray
		}

		// remove rows that arent present on the current run
		for (let i = 0; i < prev.length; i++) {
			if (prev[i].runId !== runId) {
				dispose(prev[i])
				removeFromArray(prev, prev[i--])
			}
		}

		// reorder elements
		// `rows.length > 1` because no need for sorting when there are no items
		// `prev.length > 0` to skip sorting on creation as its already sorted
		if (sort && rows.length > 1 && prev.length) {
			// when appending to already created it shouldnt sort
			// as its already sorted
			let sort = false
			for (let i = 0; i < prev.length && i < rows.length; i++) {
				if (prev[i] !== rows[i]) {
					sort = true
					break
				}
			}

			if (sort) {
				// if the planets align it handles swapping
				// a = sorted
				// b = unsorted
				const { a, b } = groupBy(rows, (value, index) =>
					rows[index] === prev[index] ? 'a' : 'b',
				)

				let unsorted = b?.length
				if (
					a &&
					b &&
					a.length &&
					b.length &&
					b.length < a.length &&
					b.every(item => prev.includes(item))
				) {
					for (const usort of b) {
						for (const sort of a) {
							if (usort.index === sort.index - 1) {
								sort.begin().before(...usort.nodesForRow())
								unsorted--
								break
							} else if (usort.index === sort.index + 1) {
								sort.end().after(...usort.nodesForRow())
								unsorted--
								break
							}
						}
					}
				}

				if (unsorted) {
					// handles all other cases
					// best for any combination of: push/pop/shift/unshift/insertion/deletion
					// must check in reverse as on creation stuff is added to the end

					let current = rows[rows.length - 1]
					for (let i = rows.length - 1; i > 0; i--) {
						const previous = rows[i - 1]
						if (current.begin().previousSibling !== previous.end()) {
							current.begin().before(...previous.nodesForRow())
						}
						current = previous
					}
				}
			}
		}

		// save sorted list
		prev = rows

		// return external representation
		return rows.flatMap(item => item.nodes)
	}
	mapper[$isMap] = undefined
	return mapper
}

/**
 * Resolves and returns `children` in a memo
 *
 * @template T
 * @param {(() => T) | T} fn
 * @returns {SignalAccessor<T>}
 * @url https://pota.quack.uy/resolve
 */
export function resolve(fn) {
	const children = isFunction(fn) ? memo(fn) : () => fn
	return memo(() => unwrap(children()))
}

/**
 * Recursively unwrap children functions
 *
 * @param {Children} children
 */
function unwrap(children) {
	if (isFunction(children)) {
		return unwrap(children())
	}

	if (isArray(children)) {
		const childrens = []
		for (let child of children) {
			child = unwrap(child)
			isArray(child)
				? childrens.push(...child)
				: childrens.push(child)
		}
		return childrens
	}

	return children
}

/**
 * Extend `Pota` and define a `render(props){}` method to create a
 * class component. `ready(cb)` and `cleanup(cb)` methods will be
 * registered automatically
 *
 * @url https://pota.quack.uy/Classes
 */
export class Pota {}

Pota[$isClass] = undefined

/**
 * Returns true if the `value` is a `Component`
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isComponent = value =>
	isFunction(value) && $isComponent in value

/**
 * Returns true if the value can be made a Component
 *
 * @param {any} value
 * @returns {boolean}
 */
export function isComponentable(value) {
	return (
		!isReactive(value) &&
		(isFunction(value) ||
			(!isArray(value) && isObject(value) && !isPromise(value)))
	)
}

// avoid [1,2] and support { toString(){ return "something"} }

/**
 * Makes of `children` a function. Reactive children will run as is,
 * non-reactive children will run untracked, regular children will
 * just return.
 *
 * @param {Children} children
 * @returns {Function}
 */
export function makeCallback(children) {
	/**
	 * When children is an array, as in >${[0, 1, 2]}< then children
	 * will end as `[[0, 1, 2]]`, so flat it
	 */

	children = isArray(children) ? unwrapArray(children) : children

	const callbacks = !isArray(children)
		? callback(children)
		: children.map(callback)

	return !isArray(children)
		? markComponent((...args) => callbacks(args))
		: markComponent((...args) =>
				callbacks.map(callback => callback(args)),
			)
}

const callback = child =>
	isFunction(child)
		? isReactive(child)
			? args => {
					/**
					 * The function inside the `for` is saved in a signal. The
					 * result of the signal is our callback
					 *
					 * ```js
					 * xml`
					 * <table>
					 * 		<tr>
					 * 			<th>name</th>
					 * 		</tr>
					 * 		<for each="${tests}">
					 * 			${item =>
					 * 				xml`<tr>
					 * 					<td>${item.name}</td>
					 * 				</tr>`}
					 * 		</for>
					 * 	</table>
					 * `
					 * ```
					 */
					// TODO this may be simplified to call itself again as `callback(r)`
					const r = child()
					return isFunction(r)
						? isReactive(r)
							? r()
							: untrack(() => r(...args))
						: r
				}
			: args => untrack(() => child(...args))
		: () => child

// allows to tell a `signal function` from a `component function`
// signals and user functions go in effects, for reactivity
// components and callbacks are untracked and wont go in effects to avoid re-rendering

/**
 * Marks a function as a `Component`.
 *
 * @template T
 * @param {T} fn - Function to mark as a `Component`
 */
export function markComponent(fn) {
	fn[$isComponent] = undefined
	return fn
}

/**
 * Adds an event listener to a node
 *
 * @param {Element | Document | typeof window} node - Element to add
 *   the event listener
 * @param {(keyof WindowEventMap & keyof GlobalEventHandlersEventMap)
 * 	| string} type
 *   - The name of the event listener
 *
 * @param {EventListener
 * 	| EventListenerObject
 * 	| (EventListenerObject & AddEventListenerOptions)} handler
 *   - Function to handle the event
 *
 * @returns {Function} - An `off` function for removing the event
 *   listener
 * @url https://pota.quack.uy/props/EventListener
 */
export function addEvent(node, type, handler) {
	node.addEventListener(
		type,
		handler,
		!isFunction(handler) && handler,
	)

	/**
	 * Removes event on tracking scope disposal.
	 *
	 * Situation: the event was added to the `document` or `window`
	 * manually using `addEvent`, say to listen for clicks as a "click
	 * outside". The event needs to be removed when the component that
	 * added it is disposed.
	 */

	return cleanup(() => removeEvent(node, type, handler))
}

/**
 * Removes an event listener from a node
 *
 * @param {Element | Document | typeof window} node - Element to add
 *   the event listener
 * @param {(keyof WindowEventMap & keyof GlobalEventHandlersEventMap)
 * 	| string} type
 *   - The name of the event listener
 *
 * @param {EventListener
 * 	| EventListenerObject
 * 	| (EventListenerObject & AddEventListenerOptions)} handler
 *   - Function to handle the event
 *
 * @returns {Function} - An `on` function for adding back the event
 *   listener
 * @url https://pota.quack.uy/props/EventListener
 */
export function removeEvent(node, type, handler) {
	node.removeEventListener(
		type,
		handler,
		!isFunction(handler) && handler,
	)

	return () => addEvent(node, type, handler)
}

/**
 * It gives a handler an owner, so stuff runs batched on it, and
 * things like context and cleanup work
 */
export const ownedEvent = handler =>
	'handleEvent' in handler
		? {
				...handler,
				handleEvent: owned(e => handler.handleEvent(e)),
			}
		: owned(handler)
