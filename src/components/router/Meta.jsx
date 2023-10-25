import { Portal } from '../flow/Portal.js'

/**
 * Mounts children on HEAD
 *
 * @param {{
 * 	children?: Children
 * }} props
 * @returns {Children}
 */
export function Meta(props) {
	return (
		<Portal
			mount={document.head}
			children={props.children}
		/>
	)
}
