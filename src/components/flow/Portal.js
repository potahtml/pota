import { render } from '#renderer'

/**
 * Portals children to a different element while keeping the original
 * scope
 *
 * @param {object} props
 * @param {pota.Element} props.mount
 * @param {pota.Children} [props.children]
 * @returns {null}
 */
export function Portal(props) {
	// use `render` instead of `insert` so in case the mount point is removed the portal is disposed
	render(props.children, props.mount)
	return null
}
