export function measure(fn) {
	const start = performance.now()
	fn()
	return performance.now() - start
}
