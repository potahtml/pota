// portal childrens to a new location

export function Portal(props, children) {
	return children.map(child => {
		// sets `mount` prop on children
		if (typeof child === 'string') return child
		child.props = { mount: props.mount, ...child.props }
		return child
	})
}
