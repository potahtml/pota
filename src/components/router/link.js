// utils
import { propsMerge, propsData } from '#main'
import { replaceParams } from '#urls'

// local
import { Context } from './context.js'

export function A(props) {
	let href = replaceParams(props.href, props.params)

	// make it absolute
	// link is relative to the <Route
	// base is '' when the link is defined outside of <Route which only make sense when testing
	const base = Context().href
	href =
		href[0] === '/' || href[0] === '#' || /^http/.test(href) || !base
			? href
			: new URL(href, base).href

	propsData(props, ['params', 'scroll', 'replace'])

	return <a {...propsMerge(props, { href })} />
}
