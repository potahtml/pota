import { Portal } from './Portal.js'

/**
 * Mounts children on `document.head`
 *
 * @param {{
 * 	children?: Children
 * }} props
 * @returns {Children}
 */
export function Head(props) {
	return (
		<Portal
			mount={document.head}
			children={props.children}
		/>
	)
}
