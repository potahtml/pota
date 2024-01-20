import { render } from '../../renderer/@renderer.js'

/**
 * Portals children to a different element while keeping the original
 * scope
 *
 * @param {object} props
 * @param {Elements} props.mount
 * @param {Children} [props.children]
 * @returns {null}
 */
export function Portal(props) {
	// use `render` instead of `insert` so in case the mount point is removed the portal is disposed
	render(props.children, props.mount)
	return null
}
