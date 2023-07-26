// portal
import { Component } from '#main'

export function Dynamic(props) {
	const component = props.component
	delete props.component
	return Component(component, props)
}
