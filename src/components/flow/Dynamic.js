import { create } from '#main'

/**
 * Creates components dynamically
 *
 * @param {{
 * 	component: pota.componenteable
 * } & pota.props} props
 * @returns {pota.component}
 */

export function Dynamic(props) {
	// `component` needs to be deleted else it will end in the tag as an attribute
	return create(props.component)({ ...props, component: null })
}
