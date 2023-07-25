// spread

export function Spread(props, children) {
	return children.map(child => {
		// copy or spread props of parent to children
		child.props = { ...props, ...child.props }
		return child
	})
}
