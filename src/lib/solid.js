import { $isReactive } from '../constants.js'
import {
	assign,
	isArray,
	noop,
	removeFromArray,
	Symbol,
	walkParents,
} from './std.js'

/**
 * This is so far the core of Solid JS 1.x Reactivity, but ported to
 * classes and adapted to my taste.
 *
 * Adaptation for potas needs include:
 *
 * - Ported to Classes what does fit
 * - Signal has more options: `label` and `save` previous value
 * - Writing to a signal returns `bollean` to tell if the value changed
 * - Signal is an object that could be used as signal.read/write or
 *   destructured as an array
 * - Signals can save and won't run functions
 * - `update` function on Signal that could be used to use the old value
 *   to set a new value
 * - The system is wrapped in a `createReactiveSystem` function so many
 *   systems can be run at the same time, for example for the
 *   developer tools context, so dev-tools context doesnt mess up the
 *   real context
 */

export function createReactiveSystem() {
	const CLEAN = 0
	const STALE = 1
	const CHECK = 2

	/** @type {Computation} */
	let Owner

	/** @type {Computation} */
	let Listener

	/** @type {Memo[]} */
	let Updates = null

	/** @type {undefined | null | any[]} */
	let Effects = null

	let Time = 0

	// ROOT

	class Root {
		/** @type {Root | undefined} */
		owner

		/** @type {Computation | Computation[]} */
		owned

		/** @type {Function | Function[]} */
		cleanups

		/** @type {Record<symbol, unknown>} */
		context

		/**
		 * @param {Root} owner
		 * @param {object} [options]
		 */
		constructor(owner, options) {
			if (owner) {
				this.owner = owner

				if (owner.context) {
					this.context = owner.context
				}
			}

			options && assign(this, options)
		}
		/** @param {Function} fn */
		addCleanups(fn) {
			if (!this.cleanups) {
				this.cleanups = fn
			} else if (isArray(this.cleanups)) {
				this.cleanups.push(fn)
			} else {
				this.cleanups = [this.cleanups, fn]
			}
		}
		/** @param {Function} fn */
		removeCleanups(fn) {
			if (!this.cleanups) {
			} else if (this.cleanups === fn) {
				this.cleanups = null
			} else {
				removeFromArray(this.cleanups, fn)
			}
		}
		/** @param {Computation} value */
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

		/** @type {Function | undefined} */
		fn

		sources
		sourceSlots

		/**
		 * @param {Root} [owner]
		 * @param {Function} [fn]
		 * @param {object} [options]
		 */
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

		/**
		 * @param {Root} [owner]
		 * @param {Function} [fn]
		 * @param {object} [options]
		 */
		constructor(owner, fn, options) {
			super(owner, fn, options)

			Effects ? Effects.push(this) : batch(() => this.update())
		}
	}

	class SyncEffect extends Computation {
		/**
		 * @param {Root} [owner]
		 * @param {Function} [fn]
		 * @param {object} [options]
		 */
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
		/**
		 * @param {Root} [owner]
		 * @param {Function} [fn]
		 * @param {object} [options]
		 */
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
		/**
		 * @param {unknown} a
		 * @param {unknown} b
		 */
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
				this.write(nextValue)
				this.updatedAt = time
			}
		}
		queue() {
			Updates.push(this)
		}
	}

	// SIGNAL

	/**
	 * @template in T
	 * @type SignalObject<T>
	 */
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
		 * @type SignalUpdate<T>
		 * @returns SignalUpdate<T>
		 */
		update = value => {
			return this.write(value(this.value))
		}

		/**
		 * @private
		 * @type {((a, B) => boolean) | false}
		 */
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
	function root(fn, options) {
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
	function signal(initialValue, options) {
		/** @type {SignalObject<T>} */
		const s = new Signal(initialValue, options)
		return s
	}

	/**
	 * Creates an effect
	 *
	 * @param {Function} fn
	 * @param {object} [options]
	 */
	function effect(fn, options) {
		new Effect(Owner, fn, options)
	}

	/**
	 * Creates an effect with explicit dependencies
	 *
	 * @param {Function} depend - Function that causes tracking
	 * @param {Function} fn - Function that wont cause tracking
	 * @param {object} [options]
	 */
	function on(depend, fn, options) {
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
	function syncEffect(fn, options) {
		return new SyncEffect(Owner, fn, options)
	}

	/**
	 * Creates a read-only signal from the return value of a function
	 * that automatically updates
	 *
	 * @template T
	 * @param {() => T} fn - Function to re-run when dependencies change
	 * @param {SignalOptions} [options]
	 */

	/* #__NO_SIDE_EFFECTS__ */ function memo(fn, options = undefined) {
		/** @type {SignalAccessor<T>} */
		const s = new Memo(Owner, fn, options)
		return s
	}

	/**
	 * Batches changes to signals
	 *
	 * @param {Function} fn
	 * @returns {any}
	 */
	const batch = runUpdates

	/**
	 * Returns current owner
	 *
	 * @returns {Computation}
	 */
	function owner() {
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
	function untrack(fn) {
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
	 * @param {T extends Function} fn
	 * @returns {T}
	 */
	function cleanup(fn) {
		Owner?.addCleanups(fn)
		return fn
	}

	/**
	 * Cancels a cleanup
	 *
	 * @template T
	 * @param {T extends Function} fn
	 * @returns {T}
	 */
	function cleanupCancel(fn) {
		Owner?.removeCleanups(fn)
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
	 * @template T
	 * @param {T} [defaultValue] - Default value for the context
	 */
	function Context(defaultValue = undefined) {
		const id = Symbol()

		/**
		 * @overload Runs `fn` with a new value as context
		 * @param {T} newValue - New value for the context
		 * @param {() => Children} fn - Callback to run with the new
		 *   context value
		 * @returns {Children} Context value
		 */
		/**
		 * @overload Gets the context value
		 * @returns {T} Context value
		 */

		function useContext(newValue, fn) {
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
		 * Sets the `value` for the context
		 *
		 * @param {object} props
		 * @param {T} props.value
		 * @param {Children} props.children
		 * @returns {Children} Children
		 * @url https://pota.quack.uy/Reactivity/Context
		 */
		useContext.Provider = props =>
			useContext(props.value, () => useContext.toHTML(props.children))

		/**
		 * Maps context following `parent` property (if any). When `true`
		 * is returned from the callback it stops walking.
		 *
		 * @param {(context: T) => boolean | void} callback
		 * @param {T} [context]
		 */
		useContext.walk = (callback, context) =>
			walkParents(context || useContext(), 'parent', callback)

		return useContext
	}

	/**
	 * Returns an owned function
	 *
	 * @template T
	 * @param {(...args: unknown[]) => T} cb
	 * @returns {() => T}
	 */
	const owned = cb => {
		const o = Owner
		return cb ? (...args) => runWithOwner(o, () => cb(...args)) : noop
	}

	// export

	return {
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
	}
}

/**
 * Marks a function as reactive. Reactive functions are ran inside
 * effects.
 *
 * @template T
 * @param {T} fn - Function to mark as reactive
 * @returns {T}
 */
export function markReactive(fn) {
	fn[$isReactive] = undefined
	return fn
}
