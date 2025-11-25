import { insert } from '../core/renderer.js'

/**
 * Portals children to a different element while keeping the original
 * scope
 *
 * @param {object} props
 * @param {DOMElement} props.mount
 * @param {Children} [props.children]
 * @url https://pota.quack.uy/Components/Portal
 */
export function Portal(props) {
	insert(props.children, props.mount)
}
