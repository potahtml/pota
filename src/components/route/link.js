import { addListeners } from '../../use/location.js'
import { replaceParams } from '../../use/url.js'

import { Component } from '../../core/renderer.js'

import { useRoute } from './context.js'

/**
 * Creates a link with Route features
 *
 * @type {Component<
 * 	{
 * 		href: string
 * 		params?: Record<string, string>
 * 		replace?: boolean
 * 	} & JSX.Elements['a']
 * >}
 * @url https://pota.quack.uy/Components/Route/A
 */
export const A = props => {
	addListeners()

	const href = useRoute().resolve(
		replaceParams(props.href, props.params),
	)

	return Component('a', { ...props, href, params: undefined })
}
