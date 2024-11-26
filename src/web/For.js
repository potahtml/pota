import { makeCallback, map } from '../lib/reactive.js'
import {
	activeElement,
	documentElement,
	isConnected,
} from '../lib/std.js'

/**
 * Renders reactive values from an signal that returns an Iterable
 * object
 *
 * @template T
 * @param {object} props
 * @param {Each<T>} props.each
 * @param {Children} [props.children]
 * @returns {Children}
 * @url https://pota.quack.uy/Components/For
 */

export const For = props =>
	map(props.each, makeCallback(props.children), true)
