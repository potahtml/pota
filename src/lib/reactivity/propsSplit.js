// const [others, local] = propsSplit(props, ['children'])

import { empty, keys, defineProperty } from '#std'

export function propsSplit(props, ...args) {
	const result = []
	const used = empty()

	for (const _props of args) {
		const target = empty()
		for (const key of _props) {
			used[key] = null
			defineProperty(target, key, {
				get() {
					return props[key]
				},
			})
		}
		result.push(target)
	}

	const target = empty()
	for (const key of keys(props)) {
		if (used[key] === undefined) {
			defineProperty(target, key, {
				get() {
					return props[key]
				},
			})
		}
	}
	result.unshift(target)
	return result
}
