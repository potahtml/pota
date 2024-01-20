import { markComponent } from '../../lib/comp/markComponent.js'
import { create } from '../../renderer/@renderer.js'
import { Portal } from './Portal.js'

/**
 * Mounts children on `document.head`
 *
 * @param {{
 * 	children?: Children
 * }} props
 * @returns {Children}
 */
export const Head = props =>
	markComponent(() =>
		create(Portal)({
			mount: document.head,
			children: props.children,
		}),
	)
