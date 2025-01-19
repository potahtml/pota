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
	emptyArray,
	entries,
	flat,
	getValue,
	groupBy,
	isArray,
	isFunction,
	isIterable,
	isObject,
	isPromise,
	keys,
	noop,
	nothing,
	queueMicrotask,
	removeFromArray,
	resolved,
	Symbol,
	withResolvers,
} from './std.js'

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
	/** @type {Root} */
	owner

	/** @type {Root | Root[] | null} */
	owned

	/** @type {Function | Function[] | | null} */
	cleanups

	/** @type {any} */
	context

	/** @param {undefined | Root} owner */
	constructor(owner, options) {
		if (owner) {
			this.owner = owner

			if (owner.context) {
				this.context = owner.context
			}
		}

		options && assign(this, options)
	}

	addCleanups(fn) {
		if (!this.cleanups) {
			this.cleanups = fn
		} else if (isArray(this.cleanups)) {
			this.cleanups.push(fn)
		} else {
			this.cleanups = [this.cleanups, fn]
		}
	}

	addOwned(value) {
		if (!this.owned) {
			this.owned = value
		} else if (isArray(this.owned)) {
			this.owned.push(value)
		} else {
			this.owned = [this.owned, value]
		}
	}

	dispose() {
		this.disposeOwned()
		this.doCleanups()
	}

	disposeOwned() {
		if (!this.owned) {
		} else if (isArray(this.owned)) {
			for (let i = this.owned.length - 1; i >= 0; i--) {
				this.owned[i].dispose()
			}
			this.owned = null
		} else {
			this.owned.dispose()
			this.owned = null
		}
	}

	doCleanups() {
		if (!this.cleanups) {
		} else if (isArray(this.cleanups)) {
			for (let i = this.cleanups.length - 1; i >= 0; i--) {
				this.cleanups[i]()
			}
			this.cleanups = null
		} else {
			this.cleanups()
			this.cleanups = null
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

		owner && owner.addOwned(this)
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

		if (this.updatedAt < time) {
			this.updatedAt = time
		}
	}

	dispose() {
		const { sources, sourceSlots } = this

		if (sources && sources.length) {
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
	queue() {
		Effects.push(this)
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
	value

	observers
	observerSlots

	// options:
	// equals

	constructor(owner, fn, options) {
		super(owner, fn, options)

		return this.read
	}

	read = markReactive(() => {
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

			const observerSlot = Listener.sources.length - 1

			if (sourceSlot) {
				this.observers.push(Listener)
				this.observerSlots.push(observerSlot)
			} else {
				this.observers = [Listener]
				this.observerSlots = [observerSlot]
			}
		}

		return this.value
	})

	write(value) {
		if (this.equals === false || !this.equals(this.value, value)) {
			this.value = value

			if (this.observers && this.observers.length) {
				runUpdates(() => {
					for (const observer of this.observers) {
						if (observer.state === CLEAN) {
							observer.queue()
							observer.observers && downstream(observer)
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
			this.disposeOwned()

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
	queue() {
		Updates.push(this)
	}
}

// SIGNAL

/** @template in T */
class Signal {
	value
	/** @private */
	observers
	/** @private */
	observerSlots

	// options:
	// equals
	// save

	// `prev` if option save was given
	/**
	 * @param {T} [value]
	 * @param {SignalOptions} [options]
	 */
	constructor(value, options) {
		this.value = value
		if (options) {
			assign(this, options)
			if (this.save) {
				/** @private */
				this.prev = value
			}
		}
	}
	/** @returns SignalAccessor<T> */
	read = markReactive(() => {
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

			const observerSlot = Listener.sources.length - 1

			if (sourceSlot) {
				this.observers.push(Listener)
				this.observerSlots.push(observerSlot)
			} else {
				this.observers = [Listener]
				this.observerSlots = [observerSlot]
			}
		}

		return this.value
	})

	/**
	 * @param {T} [value]
	 * @returns SignalSetter<T>
	 */
	write = value => {
		if (this.equals === false || !this.equals(this.value, value)) {
			if (this.save) {
				this.prev = this.value
			}
			this.value = value

			if (this.observers && this.observers.length) {
				runUpdates(() => {
					for (const observer of this.observers) {
						if (observer.state === CLEAN) {
							observer.queue()
							observer.observers && downstream(observer)
						}
						observer.state = STALE
					}
				})
			}
			return true
		}
		return false
	}
	/**
	 * @param {T} [value]
	 * @returns SignalUpdate<T>
	 */
	update = value => {
		if (isFunction(value)) {
			value = value(this.value)
		}
		return this.write(value)
	}
	/** @private */
	equals(a, b) {
		return a === b
	}

	*[Symbol.iterator]() {
		/** @type SignalAccessor<T> */
		yield this.read
		/** @type SignalSetter<T> */
		yield this.write
		/** @type SignalUpdate<T> */
		yield this.update
	}
}

// API

/**
 * Creates a new root
 *
 * @param {(dispose: () => void) => any} fn
 * @param {object} [options]
 * @returns {any}
 */
export function root(fn, options) {
	const root = new Root(Owner, options)
	return runWithOwner(root, () => fn(() => root.dispose()))
}

/**
 * Creates a signal
 *
 * @template T
 * @param {T} [initialValue] - Initial value of the signal
 * @param {SignalOptions} [options] - Signal options
 */
/* #__NO_SIDE_EFFECTS__ */
export function signal(initialValue, options) {
	return new Signal(initialValue, options)
}

/**
 * Creates an effect
 *
 * @param {Function} fn
 * @param {object} [options]
 */
export function effect(fn, options) {
	new Effect(Owner, fn, options)
}

/**
 * Creates an effect with explicit dependencies
 *
 * @param {Function} depend - Function that causes tracking
 * @param {Function} fn - Function that wont cause tracking
 * @param {object} [options]
 */
export function on(depend, fn, options) {
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
export function syncEffect(fn, options) {
	return new SyncEffect(Owner, fn, options)
}

/**
 * Creates a read-only signal from the return value of a function that
 * automatically updates
 *
 * @template T
 * @param {T} fn - Function to re-run when dependencies change
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
	Owner && Owner.addCleanups(fn)

	return fn
}

// UPDATES

function runTop(node) {
	switch (node.state) {
		case CLEAN: {
			break
		}
		case CHECK: {
			upstream(node)
			break
		}

		default: {
			const ancestors = []

			do {
				node.state && ancestors.push(node)

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
			for (const update of Updates) {
				runTop(update)
			}
		}
		Updates = null

		if (!wait) {
			const effects = Effects
			Effects = null
			effects.length && runUpdates(() => runEffects(effects))
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

function runEffects(queue) {
	let userLength = 0
	for (const effect of queue) {
		if (effect.user) {
			queue[userLength++] = effect
		} else {
			runTop(effect)
		}
	}

	for (let i = 0; i < userLength; i++) {
		runTop(queue[i])
	}
}

function upstream(node, ignore) {
	node.state = CLEAN

	for (const source of node.sources) {
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
	for (const observer of node.observers) {
		if (observer.state === CLEAN) {
			observer.state = CHECK
			observer.queue()
			observer.observers && downstream(observer)
		}
	}
}

/**
 * Creates a context and returns a function to get or set the value
 *
 * @param {any} [defaultValue] - Default value for the context
 */
export function Context(defaultValue = undefined) {
	return useContext.bind(null, Symbol(), defaultValue)
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
 * @param {Function | undefined} cb
 * @returns {() => any}
 */
export const owned = cb => {
	const o = Owner
	return cb ? (...args) => runWithOwner(o, () => cb(...args)) : noop
}

/**
 * Proxies a signals property access so you dont have to call the
 * function
 *
 * @template T
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
 * @param {any} value
 * @param {(value) => any} fn
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
 * @param {any} value
 * @param {(value: any, prev?: any) => any} fn
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
		// prev.length > 0 to skip sorting on creation as its already sorted
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
 * @param {Component | Children} fn
 * @url https://pota.quack.uy/resolve
 */
export function resolve(fn) {
	const children = isFunction(fn) ? memo(fn) : () => fn
	return memo(() => unwrap(children()))
}

/**
 * Recursively unwrap children functions
 *
 * @param {Component} children
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
