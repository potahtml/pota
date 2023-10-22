// utils
import { isRelative, replaceParams } from '#urls'

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
 * } & pota.Props} props
 *
 * @returns {pota.Children}
 */

export function A(props) {
	let href = replaceParams(props.href, props.params)

	// make it absolute
	// link is relative to the <Route
	const base = Context().href()
	href =
		!isRelative(href[0]) || !base
			? href
			: base.indexOf('/#') !== -1
			? // making link dos/ relative to http://localhost:11433/#uno/
			  // becomes http://localhost:11433/#uno/dos/
			  base + href
			: new URL(href, base).href

	return <a {...{ ...props, href, params: null }} />
}
