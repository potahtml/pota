import { $isComponent, $isMap } from '../constants.js'

import {
	emptyArray,
	getValue,
	isArray,
	isFunction,
	isObject,
	isPromise,
	nothing,
	queueMicrotask,
	removeFromArray,
	resolved,
	withResolvers,
	toEntries,
	flatToArray,
} from './std.js'

// solid

import { createReactiveSystem } from './solid.js'

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
	createReactiveSystem,
}

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
	// @ts-ignore
	return (...args) => (args.length ? write(args[0]) : read())
}

/**
 * To set and read refs. To use in ref attribute.
 *
 * @returns {SignalFunction<Element>}
 */
export const ref = () => signalFunction()

/**
 * Runs a function inside an effect if value is a function.
 * Aditionally unwraps promises.
 *
 * @template T
 * @param {Accessor<T> | Promise<T>} value
 * @param {(value: Accessed<T> | T) => void} fn
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
	return (...args) =>
		args.length ? result().write(args[0]) : result().read()
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

/** @param {() => unknown} fn */
export const microtask = fn => queueMicrotask(owned(fn))

// MAP

class Row {
	runId
	item
	index
	isDupe
	disposer
	nodes
	indexSignal
	_begin
	_end
	constructor(item, index, fn, isDupe, reactiveIndex) {
		this.item = item
		this.index = index
		this.isDupe = isDupe

		root(disposer => {
			this.disposer = disposer
			if (reactiveIndex) {
				this.indexSignal = signal(index)
				/** @type Children[] */
				this.nodes = fn(item, this.indexSignal.read)
			} else {
				/** @type Children[] */
				this.nodes = fn(item, index)
			}
			this._begin = null
			this._end = null
		})
	}

	updateIndex(index) {
		if (this.index !== index) {
			this.index = index // save sort order
			if (this.indexSignal) {
				this.indexSignal.write(index)
			}
		}
	}
	begin() {
		if (!this._begin) {
			this.getBegin(this.nodes)
		}
		return this._begin
	}
	getBegin(nodes) {
		if (isArray(nodes)) {
			return this.getBegin(nodes[0])
		}
		this._begin = nodes
	}
	end() {
		if (!this._end) {
			this.getEnd(this.nodes)
		}
		return this._end
	}
	getEnd(nodes) {
		if (isArray(nodes)) {
			return this.getEnd(nodes[nodes.length - 1])
		}
		this._end = nodes
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
 * @param {boolean} [noSort]
 * @param {Children} [fallback]
 * @param {boolean} [reactiveIndex] - Make indices reactive signals
 */
export function map(list, callback, noSort, fallback, reactiveIndex) {
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
	 * @param {Function} [fn]
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

			if (row === undefined) {
				// if the item doesnt exists, create it
				row = new Row(item, index, cb, false, reactiveIndex)
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
					row = new Row(item, index, cb, true, reactiveIndex)
					dupes.push(row)
				}
			}

			row.runId = runId // mark used on this run
			row.updateIndex(index) // Update existing row's index (reactive if needed)
			rows.push(row)
		}

		// fast clear
		if (rows.length === 0) {
			hasPrev && clear()
			prev = rows
			return fallback ? fn(fallback) : emptyArray
		}

		if (hasPrev) {
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
			if (!noSort && rows.length > 1 && prev.length) {
				// when appending to already created it shouldnt sort
				// as its already sorted
				const unsort = []
				for (let i = 0; i < prev.length && i < rows.length; i++) {
					if (prev[i] !== rows[i]) {
						unsort.push(rows[i])
					}
				}

				if (unsort.length) {
					let unsorted = unsort.length
					if (unsorted) {
						// handle swap
						for (const usort of unsort) {
							if (rows[usort.index - 1]) {
								rows[usort.index - 1]
									.end()
									.after(...usort.nodesForRow())
								unsorted--
							} else if (rows[usort.index + 1]) {
								rows[usort.index + 1]
									.begin()
									.before(...usort.nodesForRow())
								unsorted--
							}
						}

						if (unsorted) {
							// handles all other cases
							// best for any combination of: push/pop/shift/unshift/insertion/deletion
							// must check in reverse as on creation stuff is added to the end

							let current = rows[rows.length - 1]
							for (let i = rows.length - 1; i > 0; i--) {
								const previous = rows[i - 1]
								if (
									current.begin().previousSibling !== previous.end()
								) {
									current.begin().before(...previous.nodesForRow())
								}
								current = previous
							}
						}
					}
				}
			}
		}

		// save sorted list
		prev = rows

		// return external representation
		return rows.map(item => item.nodes)
	}
	mapper[$isMap] = undefined
	return mapper
}

/**
 * Resolves and returns `children` in a memo. A memo in a memo, so
 * reactivity on the inner memo doesnt trigger reactivity outside.
 *
 * @template {Children} T
 * @param {Accessor<T>} fn
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
 * Returns true if the `value` is a `Component`
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isComponent = value =>
	isFunction(value) && $isComponent in value

/**
 * Makes of `children` a function. Reactive children will run as is,
 * non-reactive children will run untracked, regular children will
 * just return.
 *
 * @template {Children} T
 * @param {T} children
 * @returns {((...args: unknown[]) => T) | T}
 */
export function makeCallback(children) {
	/** Shortcut the most used case */
	if (isFunction(children)) {
		return markComponent(children)
	}

	/**
	 * When children is an array, as in >${[0, 1, 2]}< then children
	 * will end as `[[0, 1, 2]]`, so flat it
	 */
	// @ts-ignore
	children = flatToArray(children)

	return markComponent((...args) =>
		// @ts-ignore
		children.map(child =>
			isFunction(child) ? child(...args) : child,
		),
	)
}

/**
 * Marks a function as a `Component`.
 *
 * Allows to tell a `signal function` from a `component function`.
 * Signals and user functions go in effects, for reactivity.
 * Components and callbacks are untracked and wont go in effects to
 * avoid re-rendering if signals are used in the components body
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
 * @template {Element | Document | typeof window} TargetElement
 * @param {TargetElement} node - Element to add the event listener
 * @param {EventType} type - The name of the event listener
 * @param {EventHandler<Event, TargetElement>} handler - Function to
 *   handle the event
 * @returns {Function} - An `off` function for removing the event
 *   listener
 * @url https://pota.quack.uy/props/EventListener
 */
export function addEvent(node, type, handler) {
	node.addEventListener(
		type,
		handler,
		!isFunction(handler)
			? /** @type {EventHandlerOptions} */ (handler)
			: undefined,
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
 * @template {Element | Document | typeof window} TargetElement
 * @param {TargetElement} node - Element to add the event listener
 * @param {EventType} type - The name of the event listener
 * @param {EventHandler<Event, TargetElement>} handler - Function to
 *   handle the event
 * @returns {Function} - An `on` function for adding back the event
 *   listener
 * @url https://pota.quack.uy/props/EventListener
 */
export function removeEvent(node, type, handler) {
	node.removeEventListener(
		type,
		handler,
		!isFunction(handler)
			? /** @type {EventHandlerOptions} */ (handler)
			: undefined,
	)

	return () => addEvent(node, type, handler)
}

/**
 * It gives a handler an owner, so stuff runs batched on it, and
 * things like context and cleanup work
 *
 * @template {EventHandler<Event, Element>} T
 * @param {T} handler
 */
export const ownedEvent = handler =>
	'handleEvent' in handler
		? {
				...handler,
				handleEvent: owned(e => handler.handleEvent(e)),
			}
		: owned(handler)
