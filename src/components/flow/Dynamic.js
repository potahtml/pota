import { create } from '#renderer'

/**
 * Creates components dynamically
 *
 * @param {{
 * 	component: pota.Componenteable
 * } & pota.Props} props
 * @returns {pota.Component}
 */

export function Dynamic(props) {
	// `component` needs to be deleted else it will end in the tag as an attribute
	return create(props.component)({ ...props, component: null })
}
