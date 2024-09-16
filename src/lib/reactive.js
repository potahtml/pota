/**
 * This is so far the core of Solid JS Reactivity, this may change.
 *
 * Adaptation for potas needs have been made:
 *
 * - Ported to Classes what does fit
 * - Signal has more options: `label` and `save` previous value
 * - Writing to a signal returns `true` when the value changes
 * - Signal is an object that could be used as signal.read/write or
 *   destructured as an array.
 * - Signals can save and wont run functions
 * - `update` function on Signal that could be used to use the old value
 */

import {
	$isClass,
	$isComponent,
	$isMap,
	$isReactive,
} from '../constants.js'

import {
	assign,
	entries,
	flat,
	getValue,
	groupBy,
	isArray,
	isFunction,
	isIterable,
	isObject,
	keys,
	nothing,
	queueMicrotask,
	removeFromArray,
	resolved,
	Symbol,
	withResolvers,
} from './std.js'

const CLEAN = 0
const STALE = 1
const CHECK = 2

let Owner
let Listener

let Updates = null
let Effects = null

let Time = 0

// ROOT

class Root {
	owner
	owned

	cleanups

	context

	constructor(owner, options) {
		this.owner = owner
		this.context = owner?.context

		if (options) {
			assign(this, options)
		}
	}

	dispose() {
		let i

		const { owned, cleanups } = this

		if (owned) {
			for (i = owned.length - 1; i >= 0; i--) {
				owned[i].dispose()
			}
			owned.length = 0
		}
		if (cleanups) {
			for (i = cleanups.length - 1; i >= 0; i--) {
				cleanups[i]()
			}
			cleanups.length = 0
		}
	}
}

// COMPUTATION

class Computation extends Root {
	state = STALE

	updatedAt = 0

	fn

	sources
	sourceSlots

	constructor(owner, fn, options) {
		super(owner, options)

		this.fn = fn

		if (owner) {
			if (owner.owned) {
				owner.owned.push(this)
			} else {
				owner.owned = [this]
			}
		}
	}

	update() {
		this.dispose()

		const time = Time

		const prevOwner = Owner
		const prevListener = Listener

		Listener = Owner = this
		try {
			this.fn()
		} catch (err) {
			this.updatedAt = time + 1

			throw err
		} finally {
			Owner = prevOwner
			Listener = prevListener
		}

		if (this.updatedAt <= time) {
			this.updatedAt = time
		}
	}

	dispose() {
		const { sources, sourceSlots } = this

		if (sources) {
			let source
			let observers
			let index

			let observer
			let slot
			while (sources.length) {
				source = sources.pop()
				observers = source.observers

				index = sourceSlots.pop()

				if (observers && observers.length) {
					observer = observers.pop()
					slot = source.observerSlots.pop()

					if (index < observers.length) {
						observer.sourceSlots[slot] = index
						observers[index] = observer
						source.observerSlots[index] = slot
					}
				}
			}
		}

		super.dispose()

		this.state = CLEAN
	}
}

class Effect extends Computation {
	user = true

	constructor(owner, fn, options) {
		super(owner, fn, options)

		Effects ? Effects.push(this) : batch(() => this.update())
	}
}

class SyncEffect extends Computation {
	constructor(owner, fn, options) {
		super(owner, fn, options)

		batch(() => this.update())
	}
}

// SIGNALS

class Memo extends Computation {
	state = STALE

	pure = true

	value

	observers
	observerSlots

	// options:
	// equals

	constructor(owner, fn, options) {
		super(owner, fn, options)

		return markReactive(this.read.bind(this))
	}

	read() {
		// checkReadForbidden()

		if (this.state) {
			if (this.state === STALE) {
				this.update()
			} else {
				const updates = Updates
				Updates = null
				runUpdates(() => upstream(this))
				Updates = updates
			}
		}

		if (Listener) {
			const sourceSlot = this.observers ? this.observers.length : 0

			if (Listener.sources) {
				Listener.sources.push(this)
				Listener.sourceSlots.push(sourceSlot)
			} else {
				Listener.sources = [this]
				Listener.sourceSlots = [sourceSlot]
			}

			if (this.observers) {
				this.observers.push(Listener)
				this.observerSlots.push(Listener.sources.length - 1)
			} else {
				this.observers = [Listener]
				this.observerSlots = [Listener.sources.length - 1]
			}
		}

		return this.value
	}

	write(value) {
		if (this.equals === false || !this.equals(this.value, value)) {
			this.value = value
			if (this.observers && this.observers.length) {
				runUpdates(() => {
					for (let i = 0, observer; i < this.observers.length; i++) {
						observer = this.observers[i]

						if (observer.state === CLEAN) {
							if (observer.pure) {
								Updates.push(observer)
							} else {
								Effects.push(observer)
							}
							if (observer.observers) {
								downstream(observer)
							}
						}
						observer.state = STALE
					}
				})
			}
		}
	}
	equals(a, b) {
		return a === b
	}

	update() {
		this.dispose()

		let nextValue

		const time = Time

		const prevOwner = Owner
		const prevListener = Listener

		Listener = Owner = this
		try {
			nextValue = this.fn()
		} catch (err) {
			this.state = STALE
			if (this.owned) {
				this.owned.forEach(node => node.dispose())
				this.owned.length = 0
			}
			this.updatedAt = time + 1

			throw err
		} finally {
			Owner = prevOwner
			Listener = prevListener
		}
		if (this.updatedAt <= time) {
			if (this.updatedAt !== 0) {
				this.write(nextValue)
			} else {
				this.value = nextValue
			}
			this.updatedAt = time
		}
	}
}

// SIGNAL

class Signal {
	value

	observers
	observerSlots

	// options:
	// equals
	// save

	// `prev` if option save was given

	constructor(value, options) {
		this.value = value
		if (options) {
			assign(this, options)
			if (this.save) {
				this.prev = value
			}
		}

		this.read = markReactive(this.read.bind(this))

		this.write = this.write.bind(this)
		this.update = this.update.bind(this)
	}

	read() {
		// checkReadForbidden()

		if (Listener) {
			const sourceSlot = this.observers ? this.observers.length : 0

			if (Listener.sources) {
				Listener.sources.push(this)
				Listener.sourceSlots.push(sourceSlot)
			} else {
				Listener.sources = [this]
				Listener.sourceSlots = [sourceSlot]
			}

			if (this.observers) {
				this.observers.push(Listener)
				this.observerSlots.push(Listener.sources.length - 1)
			} else {
				this.observers = [Listener]
				this.observerSlots = [Listener.sources.length - 1]
			}
		}

		return this.value
	}

	write(value) {
		if (this.equals === false || !this.equals(this.value, value)) {
			if (this.save) {
				this.prev = this.value
			}
			this.value = value
			if (this.observers && this.observers.length) {
				runUpdates(() => {
					for (let i = 0, observer; i < this.observers.length; i++) {
						observer = this.observers[i]

						if (observer.state === CLEAN) {
							if (observer.pure) {
								Updates.push(observer)
							} else {
								Effects.push(observer)
							}
							if (observer.observers) {
								downstream(observer)
							}
						}
						observer.state = STALE
					}
				})
			}
			return true
		}
		return false
	}

	update(value) {
		if (isFunction(value)) {
			value = value(this.value)
		}
		return this.write(value)
	}

	equals(a, b) {
		return a === b
	}

	*[Symbol.iterator]() {
		yield this.read
		yield this.write
		yield this.update
	}
}

// API

/**
 * Creates a new root
 *
 * @param {(dispose: Function) => any} fn
 * @param {object} [options]
 * @returns {any}
 */
export function root(fn, options = undefined) {
	const prevOwner = Owner
	const prevListener = Listener

	const root = new Root(Owner, options)

	Owner = root
	Listener = undefined

	try {
		return runUpdates(() => fn(root.dispose.bind(root)), true)
	} finally {
		Owner = prevOwner
		Listener = prevListener
	}
}

/**
 * Creates a signal
 *
 * @template T
 * @param {T} [initialValue] - Initial value of the signal
 * @param {SignalOptions} [options] - Signal options
 * @returns {SignalObject<T>}
 */
/* #__NO_SIDE_EFFECTS__ */ export function signal(
	initialValue,
	options = undefined,
) {
	return new Signal(initialValue, options)
}

/**
 * Creates an effect
 *
 * @param {Function} fn
 * @param {object} [options]
 */
export function effect(fn, options = undefined) {
	new Effect(Owner, fn, options)
}

/**
 * Creates an effect with explicit dependencies
 *
 * @param {Function} depend - Function that causes tracking
 * @param {Function} fn - Function that wont cause tracking
 * @param {object} [options]
 */
export function on(depend, fn, options = undefined) {
	effect(() => {
		depend()
		untrack(fn)
	}, options)
}

/**
 * Creates a syncEffect
 *
 * @param {Function} fn
 * @param {object} [options]
 */
export function syncEffect(fn, options = undefined) {
	return new SyncEffect(Owner, fn, options)
}

/**
 * Creates a read-only signal from the return value of a function that
 * automatically updates
 *
 * @template T
 * @param {() => T} fn - Function to re-run when dependencies change
 * @param {SignalOptions} [options]
 * @returns {SignalAccessor<T>} - Read only signal
 */

/* #__NO_SIDE_EFFECTS__ */ export function memo(
	fn,
	options = undefined,
) {
	return new Memo(Owner, fn, options)
}

/**
 * Batches changes to signals
 *
 * @param {Function} fn
 * @returns {any}
 */
export const batch = runUpdates

/**
 * Returns current owner
 *
 * @returns {typeof Owner}
 */
export function owner() {
	return Owner
}

function runWithOwner(owner, fn) {
	const prevOwner = Owner
	const prevListener = Listener

	Owner = owner
	Listener = undefined

	try {
		return runUpdates(fn, true)
	} catch (err) {
		throw err
	} finally {
		Owner = prevOwner
		Listener = prevListener
	}
}

/**
 * Disables tracking for a function
 *
 * @param {Function} fn - Function to run with tracking disabled
 * @returns {any}
 */
export function untrack(fn) {
	if (Listener === undefined) {
		return fn()
	}

	const prevListener = Listener
	Listener = undefined
	try {
		return fn()
	} finally {
		Listener = prevListener
	}
}

/**
 * Runs a callback on cleanup, returns callback
 *
 * @template T
 * @param {T} fn
 * @returns {T}
 */
export function cleanup(fn) {
	if (Owner) {
		if (Owner.cleanups) {
			Owner.cleanups.push(fn)
		} else {
			Owner.cleanups = [fn]
		}
	}
	return fn
}

// UPDATES

function runTop(node) {
	switch (node.state) {
		case CLEAN: {
			return
		}
		case CHECK: {
			return upstream(node)
		}
	}

	const ancestors = []

	do {
		if (node.state) {
			ancestors.push(node)
		}
		node = node.owner
	} while (node && node.updatedAt < Time)

	for (let i = ancestors.length - 1, updates; i >= 0; i--) {
		node = ancestors[i]

		switch (node.state) {
			case STALE: {
				node.update()
				break
			}
			case CHECK: {
				updates = Updates
				Updates = null
				runUpdates(() => upstream(node, ancestors[0]))
				Updates = updates
				break
			}
		}
	}
}

function runUpdates(fn, init = false) {
	if (Updates) {
		return fn()
	}

	let wait = false

	if (!init) {
		Updates = []
	}

	if (Effects) {
		wait = true
	} else {
		Effects = []
	}

	Time++

	try {
		const res = fn()

		if (Updates) {
			runQueue(Updates)
			Updates = null
		}
		if (!wait) {
			const effects = Effects
			Effects = null
			if (effects.length) {
				runUpdates(() => runEffects(effects))
			}
		}

		return res
	} catch (err) {
		if (!wait) {
			Effects = null
		}
		Updates = null

		throw err
	}
}

function runQueue(queue) {
	for (let i = 0; i < queue.length; i++) {
		runTop(queue[i])
	}
}

function runEffects(queue) {
	let i

	let effect
	let userLength = 0
	for (i = 0; i < queue.length; i++) {
		effect = queue[i]

		if (!effect.user) {
			runTop(effect)
		} else {
			queue[userLength++] = effect
		}
	}

	for (i = 0; i < userLength; i++) {
		runTop(queue[i])
	}
}

function upstream(node, ignore) {
	node.state = CLEAN

	for (let i = 0, source; i < node.sources.length; i++) {
		source = node.sources[i]

		if (source.sources) {
			switch (source.state) {
				case STALE: {
					if (source !== ignore && source.updatedAt < Time) {
						runTop(source)
					}
					break
				}
				case CHECK: {
					upstream(source, ignore)
					break
				}
			}
		}
	}
}

function downstream(node) {
	for (let i = 0, observer; i < node.observers.length; i++) {
		observer = node.observers[i]

		if (observer.state === CLEAN) {
			observer.state = CHECK
			if (observer.pure) {
				Updates.push(observer)
			} else {
				Effects.push(observer)
			}
			observer.observers && downstream(observer)
		}
	}
}

let readForbid = false

function checkReadForbidden() {
	if (readForbid) {
		console.trace('Signal Read!')
	}
}
export function readForbidden(fn, value) {
	const prev = readForbid
	try {
		readForbid = value
		return fn()
	} finally {
		readForbid = prev
	}
}

/**
 * Creates a context and returns a function to get or set the value
 *
 * @param {any} [defaultValue] - Default value for the context
 * @returns {typeof Context} Context
 */
export function Context(defaultValue = undefined) {
	const id = Symbol()

	return useContext.bind(null, id, defaultValue)
}

/**
 * @overload Gets the context value
 * @returns {any} Context value
 */
/**
 * @overload Runs `fn` with a new value as context
 * @param {any} newValue - New value for the context
 * @param {Function} fn - Callback to run with the new context value
 * @returns {Children} Children
 */
/**
 * @param {any} newValue
 * @param {Function} fn
 */
function useContext(id, defaultValue, newValue, fn) {
	if (newValue === undefined) {
		return Owner?.context && Owner.context[id] !== undefined
			? Owner.context[id]
			: defaultValue
	} else {
		let res

		syncEffect(() => {
			Owner.context = {
				...Owner.context,
				[id]: newValue,
			}
			res = untrack(fn)
		})

		return res
	}
}

/**
 * Returns an owned function
 *
 * @param {function | undefined} cb
 * @returns {() => any}
 */
export const owned = cb => {
	const o = Owner
	return (...args) => cb && runWithOwner(o, () => cb(...args))
}

/**
 * Returns true when value is reactive (a signal)
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isReactive = value =>
	isFunction(value) && $isReactive in value

/**
 * Marks a function as reactive. Reactive functions are ran inside
 * effects.
 *
 * @param {Function} fn - Function to mark as reactive
 * @returns {Function}
 */
export function markReactive(fn) {
	fn[$isReactive] = undefined
	return fn
}

/**
 * Proxies a signals property access so you dont have to call the
 * function
 *
 * @param {Signal} snigal - Signal to proxy
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
 * Runs a function inside an effect if value is a function
 *
 * @param {any} value
 * @param {(value) => any} fn
 */
export const withValue = (value, fn) =>
	isFunction(value) ? effect(() => fn(getValue(value))) : fn(value)

/**
 * Runs a function inside an effect if value is a function
 *
 * @param {any} value
 * @param {(value) => any} fn
 */
export function withPrevValue(value, fn) {
	if (isFunction(value)) {
		let prev = undefined
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
 * @param {Function} fn - Function to re-run when dependencies change
 * @returns {((...args) => any) | (() => any)}
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
 * 	onLoaded?: Function
 * 	onError?: ((e: Error, retry: Function) => any) | any
 * }} [options]
 *
 * @returns {Component}
 * @url https://pota.quack.uy/lazy
 */
export const lazy = (fn, options = nothing) =>
	markComponent(props => {
		const { onLoading, onLoaded, onError } = options

		const [value, setValue] = signal(onLoading)

		const _onLoaded = owned(onLoaded)

		const retry = () =>
			Promise.resolve(isFunction(fn) ? fn() : fn)
				.then(r => {
					setValue(
						markComponent(() => {
							r = isObject(r) && r.default ? r.default : r
							return isFunction(r) ? r(props) : r
						}),
					)
					microtask(_onLoaded)
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

/**
 * Reactive Map
 *
 * @template T
 * @param {Each<T>} list
 * @param {Function} callback
 * @param {boolean} sort
 */
export function map(list, callback, sort) {
	const cache = new Map()
	const duplicates = new Map() // for when caching by value is not possible [1, 2, 1, 1, 1]

	let runId = 0

	let rows = []
	/** @type any[] */
	let prev = []

	function clear() {
		for (let i = 0; i < prev.length; i++) {
			prev[i].dispose(true)
		}
		cache.clear()
		duplicates.clear()

		rows.length = 0
		prev.length = 0
	}

	// to get rid of all nodes when parent disposes
	cleanup(clear)

	class Row {
		constructor(item, index, fn, isDupe) {
			this.runId = -1
			this.item = item
			this.index = index
			this.isDupe = isDupe
			this.disposer = undefined
			this.nodes = root(disposer => {
				this.disposer = disposer
				/** @type Children[] */
				return fn(item, index)
			})
		}
		get begin() {
			return this.nodes[0]
		}
		get end() {
			return this.nodes[this.nodes.length - 1]
		}
		dispose(all) {
			// skip cache deletion as we are going to clear the full map
			if (all === undefined) {
				// delete from cache
				if (!this.isDupe) {
					cache.delete(this.item)
				} else {
					const arr = duplicates.get(this.item)
					arr.length === 1
						? duplicates.delete(this.item)
						: removeFromArray(arr, this)
				}
			}

			this.disposer()
		}
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
		const items = isIterable(value) ? value.entries() : entries(value)

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
				for (let i = 0; i < dupes.length; i++) {
					if (dupes[i].runId !== runId) {
						row = dupes[i]
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

		// remove rows that arent present on the current run
		if (rows.length === 0) {
			clear()
		} else {
			for (let i = 0; i < prev.length; i++) {
				if (prev[i].runId !== runId) {
					prev[i].dispose()
				}
			}
		}

		// reorder elements
		// `rows.length > 1` because no need for sorting when there are no items
		// prev.length > 0 to skip sorting on creation as its already sorted
		if (sort && rows.length > 1 && prev.length) {
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
							sort.begin.before(...nodesFromRow(usort))
							unsorted--
							break
						} else if (usort.index === sort.index + 1) {
							sort.end.after(...nodesFromRow(usort))
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
					if (current.begin.previousSibling !== previous.end) {
						current.begin.before(...nodesFromRow(previous))
					}
					current = previous
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

function nodesFromRow(row) {
	const { begin, end } = row
	const nodes = [begin]

	let nextSibling = begin
	while (nextSibling !== end) {
		nextSibling = nextSibling.nextSibling
		nodes.push(nextSibling)
	}

	return nodes
}

/**
 * Resolves and returns `children` in a memo
 *
 * @param {Function | Children} fn
 * @returns {Function} Memo
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
 * @returns {Children}
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
export const isComponentable = value =>
	!isReactive(value) &&
	(isFunction(value) ||
		// avoid [1,2] and support { toString(){ return "something"} }
		(!isArray(value) && isObject(value) && !value.then))

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

	children = isArray(children) ? flat(children) : children

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
					 * htmlEffect(
					 * 	html =>
					 * 		html`<table>
					 * 			<tr>
					 * 				<th>name</th>
					 * 			</tr>
					 * 			<for each="${tests}">
					 * 				${item =>
					 * 					html`<tr>
					 * 						<td>${item.name}</td>
					 * 					</tr>`}
					 * 			</for>
					 * 		</table>`,
					 * )
					 * ```
					 */
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
 * @param {Function} fn - Function to mark as a `Component`
 * @returns {Component}
 */
export function markComponent(fn) {
	fn[$isComponent] = undefined
	return fn
}

/**
 * Unwraps components till it gets a value. To keep context relevant
 * to the component
 *
 * @param {Function | any} value - Maybe function
 * @returns {any}
 */
export function getValueComponent(value) {
	while ($isComponent in value) value = value()
	return value
}

/**
 * Adds an event listener to a node
 *
 * @param {Element} node - Element to add the event listener
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
export function addEventListener(node, type, handler) {
	node.addEventListener(
		type,
		handler,
		!isFunction(handler) && handler,
	)

	/**
	 * Removes event on tracking scope disposal.
	 *
	 * Situation: the event was added to the `document` manually using
	 * `addEventListener`, say to listen for clicks as a "click
	 * outside". The event needs to be removed when the component that
	 * added it is disposed.
	 */

	return cleanup(() => removeEventListener(node, type, handler))
}

/**
 * Removes an event listener from a node
 *
 * @param {Element} node - Element to add the event listener
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
export function removeEventListener(node, type, handler) {
	node.removeEventListener(
		type,
		handler,
		!isFunction(handler) && handler,
	)

	return () => addEventListener(node, type, handler)
}
