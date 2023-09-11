// control flow

import { memo, lazyMemo, resolve, makeCallback } from '#main'

import { hasValue, getValue } from '#std'

export function Show(props) {
	const callback = makeCallback(props.children)
	const value = memo(() => getValue(props.when))
	const condition = memo(() => !!value())
	// needs resolve to avoid re-rendering
	const fallback = hasValue(props.fallback)
		? lazyMemo(() => resolve(props.fallback))
		: () => null
	return memo(() => {
		const result = condition()
		return result ? callback(value) : fallback
	})
}
