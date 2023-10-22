import { insert } from '#renderer'

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
	insert(props.children, props.mount)
	return null
}
