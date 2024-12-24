import { empty, keys } from '../lib/std.js'

/**
 * Split an object into multiple sub objects
 *
 * ```js
 * const [others, local] = propsSplit(props, ['children'])
 * ```
 *
 * @template Props
 * @param {Props} props
 * @param {...string[]} args
 * @returns {Props[]} - Array of objects
 * @url https://pota.quack.uy/props/propsSplit
 */
export function propsSplit(props, ...args) {
	const result = []
	const used = empty()

	for (const _props of args) {
		const target = empty()
		for (const key of _props) {
			used[key] = null
			target[key] = props[key]
		}
		result.push(target)
	}

	const target = empty()
	for (const key of keys(props)) {
		if (used[key] === undefined) {
			target[key] = props[key]
		}
	}
	result.unshift(target)
	return result
}
