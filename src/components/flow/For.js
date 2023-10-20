import { memo, ReactiveMap, makeCallback } from '#main'

/**
 * Renders reactive values from an signal that returns an Iterable
 * object
 *
 * @param {object} props
 * @param {pota.each} props.each
 * @param {pota.children} [props.children]
 * @returns {pota.children}
 */
export function For(props) {
	const callback = makeCallback(props.children)
	return memo(() => new ReactiveMap(props.each, callback))
}
