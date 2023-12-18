import { isFunction } from '../../lib/exports.js'
import {
	signal,
	withOwner,
} from '../../lib/reactivity/primitives/solid.js'

/**
 * Renders a fallback meanwhile runs a promise
 *
 * @param {object} props
 * @param {Children} [props.fallback]
 * @param {Function} [props.children]
 * @returns {Children}
 */
export function Promised(props, fallback) {
	const [value, setValue] = signal(props.fallback || fallback || '')
	const owned = withOwner()

	;(props.children || props)().then(r => {
		setValue(isFunction(r) ? owned(r) : r)
	})
	return value
}
