import { insert } from '../core/renderer.js'

/**
 * Portals children to a different element while keeping the original
 * scope
 *
 * @type {ParentComponent<{ mount: JSX.DOMElement }>}
 * @url https://pota.quack.uy/Components/Portal
 */
export const Portal = props => {
	insert(props.children, props.mount)
	// its portaling, it shouldnt return !
}
