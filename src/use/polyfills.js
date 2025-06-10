/**
 * Groups elements from an iterable into an object based on a callback
 * function.
 *
 * Groupby-polyfill. MIT License. Jimmy Wärting
 * [https://jimmy.warting.se/opensource](https://jimmy.warting.se/opensource)
 *
 * @template T, K
 * @param {Iterable<T>} iterable - The iterable to group.
 * @param {function(T, number): K} callbackfn - The callback function
 *   to determine the grouping key.
 * @returns {Object<string, T[]>} An object where keys are the
 *   grouping keys and values are arrays of grouped elements.
 */
Object.groupBy ??= function groupBy(iterable, callbackfn) {
	const obj = Object.create(null)
	let i = 0
	for (const value of iterable) {
		const key = callbackfn(value, i++)
		key in obj ? obj[key].push(value) : (obj[key] = [value])
	}
	return obj
}

// https://github.com/ungap/with-resolvers
Promise.withResolvers ??= function withResolvers() {
	var a,
		b,
		c = new this(function (resolve, reject) {
			a = resolve
			b = reject
		})
	return { resolve: a, reject: b, promise: c }
}

// https://github.com/ungap/has-own
Object.hasOwn ??= Object.call.bind(Object.hasOwnProperty)
