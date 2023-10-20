import { insert } from '#main'

/**
 * Portals children to a different element while keeping the original
 * scope
 *
 * @param {object} props
 * @param {pota.element} props.mount
 * @param {pota.children} [props.children]
 * @returns {null}
 */
export function Portal(props) {
	insert(props.children, props.mount)
	return null
}
