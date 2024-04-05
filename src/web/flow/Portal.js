import { render } from '../../renderer/@main.js'

/**
 * Portals children to a different element while keeping the original
 * scope
 *
 * @param {object} props
 * @param {Elements} props.mount
 * @param {Children} [props.children]
 * @url https://pota.quack.uy/Components/Portal
 */
export function Portal(props) {
	// use `render` instead of `insert` so in case the mount point is removed the portal is disposed
	render(props.children, props.mount)
}
