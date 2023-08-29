import { untrack } from '#main'
import { empty, defineProperty } from '#std'

export function getter(signal, target = empty()) {
	const props = Object.keys(untrack(signal))

	for (const key of props) {
		defineProperty(target, key, {
			get() {
				return signal()[key]
			},
		})
	}
	return target
}
