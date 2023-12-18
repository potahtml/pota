export function toString(o, length = 50) {
	return String(o || '')
		.substring(0, length)
		.trim()
}
