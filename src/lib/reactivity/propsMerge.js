import { empty, keys, defineProperty } from '#std'

// it merge objects and avoids triggering getters while doing so
// it only merges enumerable properties
// you should be using spreads {...obj1, ...obj2} if you know the props dont have getters

export function propsMerge(...props) {
	const target = empty()
	for (const _props of props) {
		for (const key of keys(_props)) {
			defineProperty(target, key, {
				get() {
					return _props[key]
				},
			})
		}
	}
	return target
}
