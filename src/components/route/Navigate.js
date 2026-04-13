import { addListeners, navigate } from '../../use/location.js'

/**
 * Navigates to a new location from JSX
 *
 * @type {ParentComponent<{
 * 	path: string
 * 	scroll?: boolean
 * 	replace?: boolean
 * 	params?: object
 * 	delay?: number
 * }>}
 * @url https://pota.quack.uy/Components/Route/Navigate
 */
export const Navigate = props => {
	addListeners()
	navigate(props.path, props)
	return props.children
}
