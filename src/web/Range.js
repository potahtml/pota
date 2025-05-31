import { range } from '../lib/std.js'
import { Component } from '../renderer.js'
import { For } from './For.js'

/**
 * Renders children based on the range function arguments
 *
 * @param {object} props
 * @param {number} props.start
 * @param {number} props.stop
 * @param {number} props.step
 * @param {Children} [props.children]
 * @returns {Children}
 */

export function Range(props) {
	const result = range(
		props.start ?? 0,
		props.stop ?? 0,
		props.step ?? 1,
	)
	return Component(For, {
		each: Array.from(result),
		children: props.children,
	})
}
