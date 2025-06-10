import { addListeners, navigate } from '../../use/location.js'

/**
 * Navigates to a new location from JSX
 *
 * @param {{
 * 	href: string
 * 	scroll?: boolean
 * 	replace?: boolean
 * 	params?: object
 * 	delay?: number
 * 	children?: Children
 * }} props
 * @url https://pota.quack.uy/Components/Route/Navigate
 */
export function Navigate(props) {
	addListeners()
	navigate(props.href, props)
	return props.children
}
