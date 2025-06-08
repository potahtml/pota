import { Component } from '../core/renderer.js'

/**
 * Creates components dynamically
 *
 * @param {{
 * 	component: Component
 * } & Props} props
 * @url https://pota.quack.uy/Components/Dynamic
 */

export const Dynamic = props =>
	// `component` needs to be deleted else it will end in the tag as an attribute
	Component(props.component, { ...props, component: undefined })
