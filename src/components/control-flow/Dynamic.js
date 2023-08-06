// dynamic
import { create } from '#main'

export function Dynamic(props) {
	const component = props.component
	// needs to be deleted else it will end in the tag as an attribute
	props.component = null
	return create(component)(props)
}
