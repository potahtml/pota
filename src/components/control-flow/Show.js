// control flow

import {
	componentCallback,
	memo,
	getValue,
	lazyMemo,
	resolve,
} from '../../index.js'

export function Show(props, children) {
	const callback = componentCallback(children)
	const condition = memo(() => getValue(props.when))
	// needs resolve to avoid re-rendering
	// `lazy` to not render it at all unless is needed
	const fallback =
		props.fallback !== undefined
			? lazyMemo(() => resolve(props.fallback))
			: () => null
	return memo(() => {
		const result = condition()
		return result ? callback(result) : fallback()
	})
}
