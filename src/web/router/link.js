// utils
import { Component } from '../../renderer/@main.js'
import { isRelative, replaceParams } from '../../lib/urls/@main.js'

// local
import { Context } from './context.js'

/*
 * // props
 * // props.href Url relative to the parent <Route/>
 * // props.params Key-value pair object params to replace in the url
 *   not scroll on location change
 * // props.replace Replace the history entry from the browser} props
 */

/**
 * Creates a link with Router features
 *
 * @param {{
 * 	href: string
 * 	params?: object
 * 	replace?: boolean
 * } & Props} props
 *
 * @returns {Children}
 * @url https://pota.quack.uy/Components/Router/A
 */

export function A(props) {
	let href = replaceParams(props.href, props.params)

	// make it absolute
	// link is relative to the <Route
	const base = Context().href()
	href =
		!isRelative(href[0]) || !base
			? href
			: base.includes('/#')
				? // making link dos/ relative to http://localhost:11433/#uno/
					// becomes http://localhost:11433/#uno/dos/
					base + href
				: new URL(href, base).href

	return Component('a', { ...{ ...props, href, params: undefined } })
}
