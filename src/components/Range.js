import { getValue, range, toArray } from '../lib/std.js'
import { Component } from '../core/renderer.js'
import { For } from './For.js'

/**
 * Renders children based on the `range` function arguments
 *
 * @type {FlowComponent<
 * 	{
 * 		start?: Accessor<number>
 * 		stop?: Accessor<number>
 * 		step?: Accessor<number>
 * 	},
 * 	Children<(item: number, index: number) => JSX.Element>
 * >}
 * @url https://pota.quack.uy/Components/Range
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
