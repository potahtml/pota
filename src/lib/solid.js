import {
	assign,
	call,
	getValue,
	isArray,
	isFunction,
	isPromise,
	noop,
	nothing,
	queueMicrotask,
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
 * - Signal has any options
 * - Writing to a signal returns `boolean` to tell if the value changed
 * - Signal is an object that could be used as signal.read/write or
 *   destructuring
 * - Signals can save and won't run functions
 * - `update` function on Signal that could be used to use the old value
 *   to set a new value
 * - The system is wrapped in a `createReactiveSystem` function so many
 *   systems can be run at the same time, for example for the
 *   developer tools context, so dev-tools context doesnt mess up the
 *   real context
 *
 * WARNING: typings here are a mess, Im slowly working on it.
 *
 * @url https://www.solidjs.com/
 * @url https://github.com/solidjs/solid
 * @url https://github.com/solidjs/signals
 */

export function createReactiveSystem() {
	const CLEAN = 0
	const STALE = 1
	const CHECK = 2

	/** @type {undefined | Computation} */
	let Owner

	/** @type {undefined | Computation} */
	let Listener

	/** @type {undefined | Memo[]} */
	let Updates

	/** @type {undefined | any[]} */
	let Effects

	let Time = 0

	// ROOT

	class Root {
		/** @type {undefined | Root} */
		owner

		/** @type {Computation | Computation[]} */
		owned

		/** @type {undefined | Function | Function[]} */
		cleanups

		/** @type {Record<symbol, unknown>} */
		context

		/**
		 * @param {Computation} owner
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
		cleanupCancel(fn) {
			if (!this.cleanups) {
			} else if (this.cleanups === fn) {
				this.cleanups = undefined
			} else if (isArray(this.cleanups)) {
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
				this.owned = undefined
			} else {
				this.owned.dispose()
				this.owned = undefined
			}
		}

		doCleanups() {
			if (!this.cleanups) {
			} else if (isArray(this.cleanups)) {
				for (let i = this.cleanups.length - 1; i >= 0; i--) {
					this.cleanups[i]()
				}
				this.cleanups = undefined
			} else {
				this.cleanups()
				this.cleanups = undefined
			}
		}
	}

	// COMPUTATION

	class Computation extends Root {
		state = 1 /* STALE */

		updatedAt = 0

		/** @type {Function | undefined} */
		fn

		sources
		sourceSlots

		/**
		 * @param {Computation} owner
		 * @param {Function} fn
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

			runWith(this.fn, this, this)

			/*} catch (err) {
				this.updatedAt = time + 1
			}*/

			if (this.updatedAt < time) {
				this.updatedAt = time
			}
		}

		dispose() {
			if (this.sources && this.sources.length) {
				let source
				let observers
				let index

				let observer
				let slot
				while (this.sources.length) {
					source = this.sources.pop()
					observers = source.observers

					index = this.sourceSlots.pop()

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

			this.state = 0 /* CLEAN */
		}
		queue() {
			Effects.push(this)
		}
	}

	class Effect extends Computation {
		user = true

		/**
		 * @param {Computation} owner
		 * @param {Function} fn
		 * @param {object} [options]
		 */
		constructor(owner, fn, options) {
			super(owner, fn, options)

			Effects ? Effects.push(this) : batch(() => this.update())
		}
	}

	class SyncEffect extends Computation {
		/**
		 * @param {Computation} owner
		 * @param {Function} fn
		 * @param {object} [options]
		 */
		constructor(owner, fn, options) {
			super(owner, fn, options)

			batch(() => this.update())
		}
	}

	// SIGNALS

	/** @template in T */
	class Memo extends Computation {
		value

		observers
		observerSlots

		// options:
		// equals
		/**
		 * @param {Computation} owner
		 * @param {Function} fn
		 * @param {object} [options]
		 */
		constructor(owner, fn, options) {
			super(owner, fn, options)

			if (options) {
				assign(this, options)
				if (options.equals === false) {
					this.equals = this.equalsFalse
				}
			}
		}

		read = () => {
			if (this.state === 1 /* STALE */) {
				this.update()
			} else if (this.state === 2 /* CHECK */) {
				const updates = Updates
				Updates = undefined
				runUpdates(() => upstream(this))
				Updates = updates
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
		}

		write(value) {
			if (!this.equals(this.value, value)) {
				this.value = value

				if (this.observers && this.observers.length) {
					runUpdates(() => {
						for (const observer of this.observers) {
							if (observer.state === 0 /* CLEAN */) {
								observer.queue()
								observer.observers && downstream(observer)
							}
							observer.state = 1 /* STALE */
						}
					})
				}
			}
		}
		/**
		 * @param {T} a
		 * @param {T} b
		 */
		equals(a, b) {
			return a === b
		}
		/**
		 * @param {T} a
		 * @param {T} b
		 */
		equalsFalse(a, b) {
			return false
		}
		update() {
			this.dispose()

			const time = Time

			const nextValue = runWith(this.fn, this, this)

			/*} catch (err) {
				this.state = 1 // STALE
				this.disposeOwned()

				this.updatedAt = time + 1

				throw err
			} */

			if (this.updatedAt <= time) {
				this.write(nextValue)
				this.updatedAt = time
			}
		}
		queue() {
			Updates.push(this)
		}
	}

	/** @template in T */
	class Derived extends Memo {
		isResolved

		/**
		 * @param {Computation} owner
		 * @param {() => T} fn
		 * @param {unknown} [initialValue]
		 */
		constructor(owner, fn, initialValue) {
			super(owner, fn)

			this.value = this.initialValue = initialValue

			return this.self()
		}

		self() {
			return assign(
				/** @type {SignalFunction<Accessed<T>>} */ (
					/** @type {unknown} */ (...args) => {
						return args.length ? this.write(args[0]) : this.read()
					}
				),
				this,
			)
		}

		resolved = () => {
			this.read() // tracking
			return this.isResolved === null
		}
		run = () => {
			this.update()
		}
		update() {
			this.dispose()
			runWith(
				() => {
					this.write(this.fn())
				},
				this,
				this,
			)
			/*
				} catch (err) {
					this.state = 1 // STALE
					this.disposeOwned()

					this.updatedAt = time + 1

					throw err
				}
			*/
		}
		write(nextValue) {
			const time = Time

			if (this.updatedAt <= time) {
				this.isResolved = undefined

				withValue(
					nextValue,
					nextValue => {
						if (this.updatedAt <= time) {
							this.isResolved = null

							this.writeNextValue(nextValue)
							this.updatedAt = time

							this.resolve && this.resolve(this)
						}
					},
					() => {
						// is a promise so restore `then`
						this.thenRestore()
						// remove the old value while the promise is resolving
						this.writeNextValue(this.initialValue)
					},
				)
			}
		}
		writeNextValue(value) {
			if (!this.equals(this.value, value)) {
				this.value = value

				if (this.observers && this.observers.length) {
					runUpdates(() => {
						for (const observer of this.observers) {
							if (observer.state === 0 /* CLEAN */) {
								observer.queue()
								observer.observers && downstream(observer)
							}
							observer.state = 1 /* STALE */
						}
					})
				}
			}
		}

		/**
		 * Thenable stuff. It has to be a property so assign works
		 * properly
		 */
		then = (resolve, reject) => {
			this._then(resolve, reject)
		}
		_then(resolve, reject) {
			this.resolve = () => {
				this.then = undefined
				this.resolve = undefined
				resolve(this.self())
			}
			if (this.resolved()) {
				this.resolve()
			}
		}
		thenRestore() {
			if (!this.then) {
				// TODO: unsure if has to be restored
				this.then = this._then
			}
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

		/**
		 * @param {T} [value]
		 * @param {SignalOptions<T>} [options]
		 */
		constructor(value, options) {
			this.value = value
			if (options) {
				assign(this, options)
				if (options.equals === false) {
					this.equals = this.equalsFalse
				}
			}
		}
		/** @returns SignalAccessor<T> */
		read = () => {
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
		}
		/**
		 * @param {T} [value]
		 * @returns SignalSetter<T>
		 */
		write = value => {
			if (!this.equals(this.value, value)) {
				this.value = value

				if (this.observers && this.observers.length) {
					runUpdates(() => {
						for (const observer of this.observers) {
							if (observer.state === 0 /* CLEAN */) {
								observer.queue()
								observer.observers && downstream(observer)
							}
							observer.state = 1 /* STALE */
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
		update = value => this.write(value(this.value))

		/**
		 * @param {T} a
		 * @param {T} b
		 */
		equals(a, b) {
			return a === b
		}

		/**
		 * @param {T} a
		 * @param {T} b
		 */
		equalsFalse(a, b) {
			return false
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
	 * @template T
	 * @param {(dispose: () => void) => T} fn
	 * @param {object} [options]
	 * @returns {T}
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
	 * @param {SignalOptions<T>} [options] - Signal options
	 */
	/* #__NO_SIDE_EFFECTS__ */ function signal(initialValue, options) {
		return /** @type {SignalObject<T>} */ (
			/** @type {unknown} */ (new Signal(initialValue, options))
		)
	}

	/**
	 * Creates an effect
	 *
	 * @template T
	 * @param {() => T} fn
	 * @param {object} [options]
	 */
	function effect(fn, options) {
		new Effect(Owner, fn, options)
	}

	/**
	 * Creates an run once effect
	 *
	 * @template T
	 * @param {() => T} fn
	 * @param {object} [options]
	 */
	function track(fn, options) {
		let ran
		new Effect(
			Owner,
			() => {
				if (ran === undefined) {
					ran = null
					fn()
				}
			},
			options,
		)
	}

	/**
	 * Creates a syncEffect
	 *
	 * @template T
	 * @param {() => T} fn
	 * @param {object} [options]
	 * @returns T
	 */
	function syncEffect(fn, options) {
		new SyncEffect(Owner, fn, options)
	}

	/**
	 * Creates an effect with explicit dependencies
	 *
	 * @template T
	 * @param {Function} depend - Function that causes tracking
	 * @param {() => T} fn - Function that wont cause tracking
	 * @param {object} [options]
	 */
	function on(depend, fn, options) {
		effect(() => {
			depend()
			untrack(fn)
		}, options)
	}

	/**
	 * Creates a read-only signal from the return value of a function
	 * that automatically updates
	 *
	 * @template T
	 * @param {() => T} fn - Function to re-run when dependencies change
	 * @param {SignalOptions<T>} [options]
	 * @returns {SignalAccessor<T>}
	 */
	/* #__NO_SIDE_EFFECTS__ */ function memo(fn, options = undefined) {
		return /** @type {SignalAccessor<T>} */ (
			/** @type {unknown} */ (new Memo(Owner, fn, options).read)
		)
	}
	/**
	 * Lazy and writable version of `memo` that unwraps and tracks
	 * functions and promises recursively
	 *
	 * @template T
	 * @param {() => T} fn - Function to re-run when dependencies change
	 * @param {Partial<Accessed<T>>} [initialValue]
	 * @returns {import('../../pota.d.ts').Derived<Accessed<T>>}
	 */
	/* #__NO_SIDE_EFFECTS__ */ function derived(
		fn,
		initialValue = nothing,
	) {
		return /** @type {import('../../pota.d.ts').Derived<Accessed<T>>} */ (
			/** @type {unknown} */ (new Derived(Owner, fn, initialValue))
		)
	}

	/**
	 * Awaitable, lazy and writable version of `memo` that unwraps and
	 * tracks functions and promises recursively
	 *
	 * @template T
	 * @param {() => T} fn - Function to re-run when dependencies change
	 * @param {Partial<Accessed<T>>} [initialValue]
	 * @returns {import('../../pota.d.ts').DerivedAsync<Accessed<T>>}
	 */
	/* #__NO_SIDE_EFFECTS__ */ function derivedAsync(
		fn,
		initialValue = nothing,
	) {
		return /** @type {import('../../pota.d.ts').DerivedAsync<Accessed<T>>} */ (
			/** @type {unknown} */ (new Derived(Owner, fn, initialValue))
		)
	}

	/**
	 * Batches changes to signals
	 *
	 * @template T
	 * @param {() => T} fn
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

	/**
	 * Runs a function with owner and listener
	 *
	 * @param {Function} fn
	 * @param {Computation} owner
	 * @param {Listener} [listener]
	 */
	function runWith(fn, owner, listener = undefined) {
		if (listener === Listener && owner === Owner) {
			return fn()
		}

		const prevOwner = Owner
		const prevListener = Listener

		Owner = owner
		Listener = listener

		try {
			return fn()
		} finally {
			Owner = prevOwner
			Listener = prevListener
		}
	}
	function runWithOwner(owner, fn) {
		return runWith(() => runUpdates(fn, true), owner)
	}

	/**
	 * Disables tracking for a function
	 *
	 * @template T
	 * @param {() => T} fn - Function to run with tracking disabled
	 * @returns {T}
	 */
	function untrack(fn) {
		if (Listener === undefined) {
			return fn()
		}

		return runWith(fn, Owner)
	}

	/**
	 * Runs a callback on cleanup, returns callback
	 *
	 * @template {Function} T
	 * @param {T} fn
	 * @returns {T}
	 */
	function cleanup(fn) {
		Owner?.addCleanups(fn)
		return fn
	}

	// UPDATES

	function runTop(node) {
		switch (node.state) {
			case 0 /* CLEAN */: {
				break
			}
			case 2 /* CHECK */: {
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
						case 1 /* STALE */: {
							node.update()
							break
						}
						case 2 /* CHECK */: {
							updates = Updates
							Updates = undefined
							runUpdates(() => upstream(node, ancestors[0]))
							Updates = updates
							break
						}
					}
				}
			}
		}
	}

	/**
	 * @template T
	 * @param {() => T} fn
	 * @param {boolean} init
	 * @returns {T}
	 */
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
			Updates = undefined

			if (!wait) {
				const effects = Effects
				Effects = undefined
				effects.length && runUpdates(() => runEffects(effects))
			}

			return res
		} catch (err) {
			if (!wait) {
				Effects = undefined
			}
			Updates = undefined

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
		node.state = 0 /* CLEAN */

		for (const source of node.sources) {
			if (source.sources) {
				switch (source.state) {
					case 1 /* STALE */: {
						if (source !== ignore && source.updatedAt < Time) {
							runTop(source)
						}
						break
					}
					case 2 /* CHECK */: {
						upstream(source, ignore)
						break
					}
				}
			}
		}
	}

	function downstream(node) {
		for (const observer of node.observers) {
			if (observer.state === 0 /* CLEAN */) {
				observer.state = 2 /* CHECK */
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
	/* #__NO_SIDE_EFFECTS__ */ function context(
		defaultValue = undefined,
	) {
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
				let ret
				syncEffect(() => {
					Owner.context = {
						...Owner.context,
						[id]: newValue,
					}
					ret = untrack(fn)
				})
				return ret
			}
		}

		/**
		 * Sets the `value` for the context
		 *
		 * @param {object} props
		 * @param {Partial<T>} props.value
		 * @param {Children} props.children
		 * @returns {Children} Children
		 * @url https://pota.quack.uy/Reactivity/Context
		 */
		useContext.Provider = props =>
			// @ts-expect-error
			useContext(props.value, () => context.toHTML(props.children))

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
	 * Returns an owned function, that will only run if the owner wasnt
	 * dispose already. `onCancel` will run if the owner of the owned
	 * function is disposed, and wont run if the owned function runs.
	 *
	 * @template T
	 * @template A
	 * @param {((...args: A[]) => T) | Function} cb
	 * @param {() => void} [onCancel]
	 */
	const owned = (cb, onCancel) => {
		if (cb) {
			const o = Owner

			/**
			 * Canceling prevent the callback from running and runs
			 * `onCancel` if provided.
			 */
			let cleaned
			const clean = cleanup(() => {
				cleaned = null
				onCancel && onCancel()
			})

			return (...args) => {
				o?.cleanupCancel(clean)
				return cleaned !== null && runWithOwner(o, () => cb(...args))
			}
		}
		return noop
	}

	/**
	 * Unwraps and tracks functions and promises recursively providing
	 * the result to a callback
	 *
	 * @template T
	 * @param {Accessor<T> | Promise<T>} value
	 * @param {(value: T) => void} fn
	 */
	function withValue(value, fn, writeDefaultValue = noop) {
		if (isFunction(value)) {
			// TODO maybe change this to be a memo
			effect(() => withValue(value(), fn, writeDefaultValue))
		} else if (isPromise(value)) {
			asyncTracking.add()
			/**
			 * WriteDefaultValue is used to avoid a double write. If the
			 * value has no promises, then it will be a native value or a
			 * function, which will resolve without having to wait.
			 *
			 * In case of promises, the value is resolved at a later point
			 * in time, so we need an intermediate default
			 */
			writeDefaultValue()

			value.then(
				owned(
					value => {
						asyncTracking.remove()
						withValue(value, fn, noop)
					},
					() => asyncTracking.remove(),
				),
			)
		} else {
			fn(value)
		}
	}

	/**
	 * Unwraps functions and promises recursively canceling if owner
	 * gets disposed
	 *
	 * @template T
	 * @param {Accessor<T> | Promise<T>} value
	 * @returns {T | Promise<T> | void}
	 */
	const resolve = value =>
		isFunction(value)
			? track(() => resolve(getValue(value)))
			: isPromise(value)
				? value.then(owned(resolve))
				: value
	/**
	 * Unwraps functions and promises recursively canceling if owner
	 * gets disposed
	 *
	 * @template T
	 * @template A
	 * @param {((...args: A[]) => T) | Function} cb
	 */
	const action = cb => owned((...args) => resolve(cb(...args)))

	/** Utilities exposed for tracking async work from user-land. */

	const asyncTracking = (() => {
		let added = false
		let fns = []
		let count = 0

		function add() {
			count++
		}

		function remove() {
			--count === 0 && queue()
		}
		function ready(fn) {
			fns.push(owned(fn))
			queue()
		}

		function queue() {
			if (!added && fns.length) {
				added = true
				queueMicrotask(() => queueMicrotask(() => run()))
			}
		}
		function run() {
			added = false

			if (count === 0) {
				const cbs = fns.slice()
				fns.length = 0
				call(cbs)
			}
		}
		return { add, remove, ready }
	})()

	/** Suspense */
	class createSuspenseContext {
		s = signal(false)
		c = 0
		add() {
			this.c++
			asyncTracking.add()
		}
		remove() {
			if (--this.c === 0) {
				this.s.write(true)
			}
			asyncTracking.remove()
		}
		isEmpty() {
			return this.c === 0
		}
	}

	const useSuspense = context(new createSuspenseContext())

	// export

	return {
		action,
		asyncTracking,
		batch,
		cleanup,
		context,
		createSuspenseContext,
		derived,
		derivedAsync,
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
		useSuspense,
		withValue,
	}
}
