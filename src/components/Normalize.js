import { unwrap } from '../lib/reactive.js'

/**
 * Resolves children as text. It creates 1 effect that contains all
 * the children, instead of each child with its own effect.
 *
 * @template T
 * @param {object} props
 * @param {Children} [props.children]
 * @returns {Children}
 * @url https://pota.quack.uy/Components/Suspense
 */
export const Normalize = props => () =>
	unwrap(props.children).join('')
