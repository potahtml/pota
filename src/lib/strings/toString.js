export const toString = (o, length = 50) =>
	String(o || '')
		.substring(0, length)
		.trim()
