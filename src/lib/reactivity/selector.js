import { memo } from '#main'
import { getValue } from '#std'

export function selector(signal) {
	return item => memo(() => getValue(item) === signal())
}
