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
 * - Update function on Signal that could be used to use the old value
 */

import { Symbol } from '../std/Symbol.js'
import { assign } from '../std/assign.js'
import { isFunction } from '../std/isFunction.js'
import { markReactive } from './markReactive.js'

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

	constructor(owner) {
		this.owner = owner
		this.context = owner?.context
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

	constructor(owner, fn) {
		super(owner)

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

	constructor(owner, fn) {
		super(owner, fn)

		Effects ? Effects.push(this) : batch(() => this.update())
	}
}

class SyncEffect extends Computation {
	constructor(owner, fn) {
		super(owner, fn)

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
		super(owner, fn)

		if (options) {
			assign(this, options)
		}

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
		if (typeof value === 'function') {
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
 * @returns {any}
 */
export function root(fn) {
	const prevOwner = Owner
	const prevListener = Listener

	const root = new Root(Owner)

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
 * @param {any} [initialValue] - Initial value of the signal
 * @param {SignalOptions} [options] - Signal options
 * @returns {SignalObject<T>}
 */
export function signal(initialValue, options = undefined) {
	return new Signal(initialValue, options)
}

/**
 * Creates an effect
 *
 * @param {Function} fn
 */
export function effect(fn) {
	return new Effect(Owner, fn)
}

/**
 * Creates a syncEffect
 *
 * @param {Function} fn
 */
export function syncEffect(fn) {
	return new SyncEffect(Owner, fn)
}

/**
 * Creates a read-only signal from the return value of a function that
 * automatically updates
 *
 * @param {Function} fn - Function to re-run when dependencies change
 * @param {SignalOptions} [options]
 * @returns {Signal} - Read only signal
 */
export function memo(fn, options = undefined) {
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

export function runWithOwner(owner, fn) {
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
 * @param {Generic<T>} fn
 * @returns {Generic<T>}
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

/*

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
*/

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
 * Returns a function on which you can pass functions to run with the
 * current owner
 *
 * @returns {(fn) => any}
 */
export const withOwner = () => {
	const o = Owner
	return fn => (isFunction(fn) ? runWithOwner(o, fn) : fn)
}
