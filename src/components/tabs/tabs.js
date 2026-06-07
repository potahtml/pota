import { Context } from './context.js'
import { Component } from '../../core/renderer.js'
import { signal } from '../../lib/reactive.js'

import { Labels, Label } from './labels.js'
import { Panels, Panel } from './panels.js'

let group = 0

/**
 * Context wrapper for tabs
 *
 * @param {{
 * 	selected?: number
 * 	onSelected?: (selected: { id: number; name: string }) => void
 * 	children?: JSX.Element
 * }} props
 *   - `selected` is the initial tab index. `onSelected` is called with `{
 *       id, name }` each time a tab is picked — lift it into a
 *       caller-owned signal to observe the selection from outside the
 *       tree.
 *
 * @returns {JSX.Element}
 * @url https://pota.quack.uy/components/Tabs
 */
export function Tabs(props) {
	return Component(Context.Provider, {
		value: {
			selected: signal({ id: props.selected || 0, name: '' }),
			group: group++,
			onSelected: props.onSelected,
		},
		children: props.children,
	})
}

Tabs.Labels = Labels
Tabs.Label = Label
Tabs.Panels = Panels
Tabs.Panel = Panel
Tabs.selected = () => Context().selected
