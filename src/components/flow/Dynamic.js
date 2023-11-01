import { create } from '../../renderer/@main.js'

/**
 * Creates components dynamically
 *
 * @param {{
 * 	component: Componenteable
 * } & Props} props
 * @returns {Component}
 */

export const Dynamic = props =>
	// `component` needs to be deleted else it will end in the tag as an attribute
	create(props.component)({ ...props, component: null })
