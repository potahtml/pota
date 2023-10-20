import { memo, lazyMemo, resolve, makeCallback } from '#main'

import { getValue, isNullUndefined } from '#std'

/**
 * Renders its children based on a condition
 *
 * @param {object} props
 * @param {pota.when} props.when
 * @param {pota.children} [props.children]
 * @param {pota.children} [props.fallback]
 * @returns {pota.children}
 */
export function Show(props) {
	const callback = makeCallback(props.children)
	const value = memo(() => getValue(props.when))
	const condition = memo(() => !!value())

	// needs resolve to avoid re-rendering
	const fallback = isNullUndefined(props.fallback)
		? () => null
		: lazyMemo(() => resolve(props.fallback))

	return memo(() => {
		const result = condition()
		return result ? callback(value) : fallback
	})
}
