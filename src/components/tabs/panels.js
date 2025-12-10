import { Context } from './context.js'
import { Component } from '../../core/renderer.js'
import { For } from '../For.js'
import { Dynamic } from '../Dynamic.js'
import { Collapse } from '../Collapse.js'
import { Show } from '../Show.js'

/**
 * Renders a tab panel with contents
 *
 * @param {object} props
 * @param {import('./panels.js').Panel[]} [props.children]
 * @returns {Children}
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
 * @param {Elements['section'] & {
 * 	collapse?: boolean
 * }} props
 *
 *   - Leftover props are passed to the section container
 *
 * @url https://pota.quack.uy/Components/Tabs
 */
export function Panel(props) {
	return props
}
