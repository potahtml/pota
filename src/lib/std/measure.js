export function measure(name, cb) {
	console.time(name)
	const r = cb()
	console.timeEnd(name)
	return r
}

export function timing(fn) {
	const start = performance.now()
	fn()
	return performance.now() - start
}
