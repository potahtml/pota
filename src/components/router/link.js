// utils
import { propsMerge, propsData } from '#main'
import { isRelative, replaceParams } from '#urls'

// local
import { Context } from './context.js'

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

	propsData(props, ['params', 'scroll', 'replace'])

	return <a {...propsMerge(props, { href })} />
}
