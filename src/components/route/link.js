import { addListeners } from '../../use/location.js'
import { replaceParams } from '../../use/url.js'

import { Component } from '../../core/renderer.js'

import { RouteContext } from './context.js'

/**
 * Creates a link with Route features
 *
 * @param {{
 * 	href: string
 * 	params?: Record<string, string>
 * 	replace?: boolean
 * } & Elements['a']} props
 *
 * @returns {Children}
 * @url https://pota.quack.uy/Components/Route/A
 */

export function A(props) {
	addListeners()

	const href = RouteContext().resolve(
		replaceParams(props.href, props.params),
	)

	return Component('a', { ...props, href, params: undefined })
}
