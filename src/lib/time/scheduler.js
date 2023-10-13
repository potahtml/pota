import { call } from '#std'

export class Scheduler {
	constructor(cb, _finally) {
		this.cb = cb
		this._finally = _finally
		this.reset()
	}
	reset() {
		this.queue = [[], [], [], []]
		this.do = false
	}
	add(priority, fn) {
		if (!this.do) {
			this.do = true
			queueMicrotask(this.process)
		}
		this.queue[priority].push(fn)
	}
	process = () => {
		const queue = this.queue
		this.reset()
		this.cb(() => {
			for (const fns of queue) {
				for (const fn of fns) call(...fn)
			}
		})
		this._finally()
	}
}
