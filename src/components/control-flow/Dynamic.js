// portal
import { Component } from '../../index.js'

export function Dynamic(props) {
	const component = props.component
	delete props.component
	return Component(component, props)
}
