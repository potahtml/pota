import { Context } from './context.js'
import { Component } from '../../core/renderer.js'
import { For } from '../For.js'
import { Dynamic } from '../Dynamic.js'
import { Collapse } from '../Collapse.js'
import { Show } from '../Show.js'

/**
 * Renders a tab panel with contents
 *
 * `props.children` is expected to be `Tabs.Panel` elements. Not
 * enforced by TypeScript: JSX expressions always resolve to
 * `JSX.Element`, so the specific component identity cannot be
 * constrained at the type level.
 *
 * @param {object} props
 * @param {JSX.Element} [props.children]
 * @returns {JSX.Element}
 * @url https://pota.quack.uy/Components/Tabs
 */
export function Panels(props) {
	const context = Context()
	const { selected, group } = context

	return Component(For, {
		each: () => [props.children].flat(),
		children: (props, id) => {
			// @ts-ignore
			const { collapse, children, ...rest } = props()

			return Component(Dynamic, {
				component: collapse ? Collapse : Show,
				when: () => selected.read().id === id,
				children: Component('section', {
					id: `tab-panel-${group}-${id}`,
					'aria-labelledby': `tab-${group}-${id}`,
					...rest,
					children,
				}),
			})
		},
	})
}

/**
 * Passthrough for content in TabPanel
 *
 * @param {Merge<
 * 	JSX.Elements['section'],
 * 	{
 * 		collapse?: boolean
 * 	}
 * >} props
 *   - Leftover props are passed to the section container
 *
 * @url https://pota.quack.uy/Components/Tabs
 */
export function Panel(props) {
	return props
}
