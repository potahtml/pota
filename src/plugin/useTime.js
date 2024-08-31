export const now = () => Date.now()

export function date(timestamp = now()) {
	const o = new Date(timestamp)

	return (
		o.getFullYear() +
		'-' +
		(o.getMonth() + 1 < 10 ? '0' : '') +
		(o.getMonth() + 1) +
		'-' +
		(o.getDate() < 10 ? '0' : '') +
		o.getDate()
	)
}

export function datetime(timestamp = now()) {
	return date(timestamp) + ' ' + time(timestamp)
}

export function time(timestamp = now()) {
	return timeWithSeconds(timestamp).slice(0, -3)
}

export function timeWithSeconds(timestamp = now()) {
	const o = new Date(timestamp)

	return (
		(o.getHours() < 10 ? '0' : '') +
		o.getHours() +
		':' +
		(o.getMinutes() < 10 ? '0' : '') +
		o.getMinutes() +
		':' +
		(o.getSeconds() < 10 ? '0' : '') +
		o.getSeconds()
	)
}

export function day(timestamp = now(), lang = 'en') {
	const o = new Date(timestamp)

	// saturday, September 17, 2016
	return o.toLocaleDateString(lang, {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
}

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
