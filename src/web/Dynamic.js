import { Component } from '../renderer.js'

/**
 * Creates components dynamically
 *
 * @template props
 * @param {{
 * 	component: Component
 * } & props} props
 * @returns {Component}
 * @url https://pota.quack.uy/Components/Dynamic
 */

export const Dynamic = props =>
	// `component` needs to be deleted else it will end in the tag as an attribute
	Component(props.component, { ...props, component: undefined })
