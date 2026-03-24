import { getValue, range, toArray } from '../lib/std.js'
import { Component } from '../core/renderer.js'
import { For } from './For.js'

/**
 * Renders children based on the `range` function arguments
 *
 * @param {object} props
 * @param {Accessor<number>} [props.start]
 * @param {Accessor<number>} [props.stop]
 * @param {Accessor<number>} [props.step]
 * @param {Children} [props.children]
 * @returns {Children}
 */

export const Range = props =>
	Component(For, {
		each: () =>
			toArray(
				range(
					getValue(props.start) ?? 0,
					getValue(props.stop) ?? 0,
					getValue(props.step) ?? 1,
				),
			),
		children: props.children,
	})
