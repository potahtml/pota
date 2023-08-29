import { create } from '#main'

export function Dynamic(props) {
	// `component` needs to be deleted else it will end in the tag as an attribute
	return create(props.component)({ ...props, component: null })
}
