export function measure(name, cb) {
	console.time(name)
	const r = cb()
	console.timeEnd(name)
	return r
}
