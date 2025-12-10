import { Context } from './context.js'
import { Component } from '../../core/renderer.js'
import { For } from '../For.js'
import { Show } from '../Show.js'
import { getValue } from '../../lib/std.js'

/**
 * Renders a list of tabs
 *
 * @param {Merge<
 * 	Elements['nav'],
 * 	{
 * 		children: import('./labels.js').Label[]
 * 	}
 * >} props
 * @url https://pota.quack.uy/Components/Tabs
 */
export function Labels(props) {
	const context = Context()
	const group = context.group
	const [selected, setSelected] = context.selected

	function onTabClick(event, group, id, name, props) {
		setSelected({ id, name })
		props.onClick && props.onClick({ event, group, id, props })
	}

	const { children, ...rest } = props

	return Component('nav', {
		role: 'tablist',
		...rest,
		children: Component(For, {
			each: () => [children].flat(),
			children: (props, id) => {
				// @ts-ignore
				props = props()

				const {
					// @ts-ignore
					children,
					// @ts-ignore
					onClick,
					// @ts-ignore
					selected: defaultSelected,
					// @ts-ignore
					hidden,
					// @ts-ignore
					name,
					// @ts-ignore
					...rest
				} = props

				if (defaultSelected || selected().id === id)
					setSelected({ id, name })

				return Component(Show, {
					when: () => !getValue(hidden),
					children: Component('button', {
						id: `tab-${group}-${id}`,
						role: 'tab',
						'aria-selected': () =>
							selected().id === id ? 'true' : 'false',
						'aria-controls': `tab-panel-${group}-${id}`,
						'on:click': e => onTabClick(e, group, id, name, props),
						...rest,
						children,
					}),
				})
			},
		}),
	})
}

/**
 * Passthrough for label in TabList
 *
 * @param {Merge<
 * 	Elements['button'],
 * 	{
 * 		selected?: boolean
 * 		name?: string
 * 		hidden?: Accessor<boolean>
 * 		onClick?: (
 * 			event: Event,
 * 			group: number,
 * 			index: number,
 * 			props: object,
 * 		) => void
 * 	}
 * >} props
 * @url https://pota.quack.uy/Components/Tabs
 */
export function Label(props) {
	return props
}
