export function* range(start, stop, step = 1) {
	yield start
	while (start < stop) {
		yield (start += step)
	}
}
