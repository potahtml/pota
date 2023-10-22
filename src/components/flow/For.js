import { makeCallback } from '#comp'
import { memo } from '#primitives'
import { ReactiveMap } from '#renderer/map.js'

/**
 * Renders reactive values from an signal that returns an Iterable
 * object
 *
 * @param {object} props
 * @param {pota.Each} props.each
 * @param {pota.Children} [props.children]
 * @returns {pota.Children}
 */
export function For(props) {
	const callback = makeCallback(props.children)
	return memo(() => new ReactiveMap(props.each, callback))
}
