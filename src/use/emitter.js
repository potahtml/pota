import { cleanup, effect, signal, untrack } from '../lib/reactive.js'

export class Emitter {
	#on
	#off

	/** @type SignalClass<unknown> */
	#signal
	#initialValue

	#counter = 0

	/**
	 * @param {{
	 * 	on: (dispatch: Function) => () => void
	 * 	initialValue?: () => unknown
	 * }} arg
	 */
	constructor({ on, initialValue = () => undefined }) {
		this.#on = on
		this.#initialValue = initialValue
	}

	// public api

	use = () => {
		this.#add()

		return this.#signal.read
	}
	/** @param {Function} fn */
	on = fn => {
		this.#add()

		effect(() => {
			const r = this.#signal.read()
			untrack(() => fn(r))
		})
	}

	// private api

	#add() {
		if (++this.#counter === 1) {
			this.#signal = this.#signal || signal()
			// value updates with initialValue
			this.#signal.write(untrack(this.#initialValue))

			this.#off = untrack(() => this.#on(this.#signal.write))
		}
		cleanup(this.#remove)
	}
	#remove = () => {
		if (--this.#counter === 0) {
			this.#off(this.#signal.write)
			// reset signal to not leak objects
			this.#signal.write()
		}
	}
}
