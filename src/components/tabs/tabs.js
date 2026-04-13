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
 * 	children?: JSX.Element
 * }} props
 * @returns {JSX.Element}
 * @url https://pota.quack.uy/Components/Tabs
 */
export function Tabs(props) {
	return Component(Context.Provider, {
		value: {
			selected: signal({ id: props.selected || 0, name: '' }),
			group: group++,
		},
		children: props.children,
	})
}

Tabs.Labels = Labels
Tabs.Label = Label
Tabs.Panels = Panels
Tabs.Panel = Panel
Tabs.selected = () => Context().selected
