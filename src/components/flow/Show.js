import { makeCallback } from '#comp'
import { memo, resolve, lazyMemo } from '#primitives'

import { getValue, isNullUndefined } from '#std'

/**
 * Renders its children based on a condition
 *
 * @param {object} props
 * @param {pota.When} props.when
 * @param {pota.Children} [props.fallback]
 * @param {pota.Children} [props.children]
 * @returns {pota.Children}
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
