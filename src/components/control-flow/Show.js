// control flow

import {
	makeCallback,
	memo,
	hasValue,
	getValue,
	lazyMemo,
	resolve,
} from '#main'

export function Show(props, children) {
	const callback = makeCallback(children)
	const value = memo(() => getValue(props.when))
	const condition = memo(() => !!value())
	// needs resolve to avoid re-rendering
	const fallback = hasValue(props.fallback)
		? lazyMemo(() => resolve(props.fallback))
		: () => null
	return memo(() => {
		const result = condition()
		return result ? callback(value) : fallback()
	})
}
