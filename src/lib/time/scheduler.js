import { call } from '#std'

/** Class to batch callbacks to run after a microtask */
export class Scheduler {
	/** @type {[][]} */
	queue = [[], [], []]
	/**
	 * Creates a Scheduler
	 *
	 * @param {Function} wrapper - Queued callbacks will be wrapped by
	 *   this function [ex `untrack`]
	 * @param {Function} _finally - Function to run after the queued
	 *   callbacks ran
	 */
	constructor(wrapper, _finally) {
		this.wrapper = wrapper
		this._finally = _finally
		this.reset()
	}
	/** Resets the Scheduler */
	reset() {
		this.queue = [[], [], []]
		this.do = false
	}
	/**
	 * Queues a callback at a priority
	 *
	 * @param {number} priority - Priority
	 * @param {unknown[]} fn - Function to run once the callbacks at
	 *   this priority run
	 */
	add(priority, fn) {
		if (!this.do) {
			this.do = true
			queueMicrotask(this.process)
		}
		this.queue[priority].push(fn)
	}
	/** Runs all queued callbacks */
	process = () => {
		const queue = this.queue
		this.reset()
		this.wrapper(() => {
			for (const fns of queue) {
				for (const fn of fns) call(...fn)
			}
		})
		this._finally()
	}
}
